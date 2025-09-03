import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { Redis } from "ioredis";

import { PrismaService } from "../core/database/prisma.service";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject("REDIS_CLIENT") private readonly redis: Redis
  ) {}
  private readonly logger = new Logger(UsersService.name);

  private async execWithTimeout<T>(
    promise: Promise<T>,
    label: string,
    timeoutMs: number = 5000
  ): Promise<T | undefined> {
    try {
      const result = await Promise.race<
        T | { __timeout: true }
      >([
        promise,
        new Promise<{ __timeout: true }>((resolve) =>
          setTimeout(() => resolve({ __timeout: true }), timeoutMs)
        ),
      ]);
      if ((result as any)?.__timeout) {
        this.logger.error(`${label} timeout after ${timeoutMs}ms`);
        return undefined;
      }
      return result as T;
    } catch (e) {
      this.logger.error(`${label} failed`, e as Error);
      return undefined;
    }
  }

  async findMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException("사용자를 찾을 수 없습니다.");
    }

    return user;
  }

  async updateUserLocation(
    userId: string,
    latitude: number,
    longitude: number
  ): Promise<{ success: boolean }> {
    try {
      const startedAt = Date.now();
      this.logger.log(`updateUserLocation start user=${userId} lat=${latitude} lon=${longitude}`);

      await this.prisma.$executeRawUnsafe(
        `
        INSERT INTO "User_Location" ("userId","latitude","longitude","updatedAt")
        VALUES ($1,$2,$3, now())
        ON CONFLICT ("userId") DO UPDATE
        SET "latitude"=EXCLUDED."latitude",
            "longitude"=EXCLUDED."longitude",
            "updatedAt"=now();
        `,
        userId,
        latitude,
        longitude
      );
      this.logger.log(`DB upsert done in ${Date.now() - startedAt}ms for user=${userId}`);

      // 빠른 연결 확인(PING)
      const pingStart = Date.now();
      await this.execWithTimeout(this.redis.ping(), "Redis PING");
      this.logger.log(`Redis PING done in ${Date.now() - pingStart}ms for user=${userId}`);

      const redisStart = Date.now();
      await this.execWithTimeout(
        this.redis.geoadd("user_locations", longitude, latitude, userId),
        "Redis GEOADD"
      );
      this.logger.log(`Redis GEOADD done in ${Date.now() - redisStart}ms for user=${userId}`);

      const zaddStart = Date.now();
      await this.execWithTimeout(
        this.redis.zadd("user_last_seen", Date.now().toString(), userId),
        "Redis ZADD"
      );
      this.logger.log(`Redis ZADD done in ${Date.now() - zaddStart}ms for user=${userId}`);

      console.log(
        `[Redis] 사용자 위치 업데이트: ${userId} -> (${longitude}, ${latitude})`
      );
      return { success: true };
    } catch (error) {
      // DB 업서트만 성공해도 응답을 지연시키지 않도록 200으로 처리하고 로그만 남김
      this.logger.error("updateUserLocation failed", error as Error);
      return { success: true };
    }
  }

  async selectHobbies(userId: string, hobbyIds: number[]) {
    const existing = await this.prisma.hobby.findMany({
      where: { id: { in: hobbyIds } },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((h) => h.id));
    const invalidIds = hobbyIds.filter((id) => !existingIds.has(id));
    if (invalidIds.length > 0) {
      throw new Error(
        `존재하지 않는 취미 ID: ${invalidIds.join(
          ", "
        )}. 먼저 취미 데이터를 시드하거나 유효한 ID를 보내세요.`
      );
    }

    const dataToCreate = hobbyIds.map((hobbyId) => ({
      userId: userId,
      hobbyId: hobbyId,
    }));

    await this.prisma.$transaction([
      this.prisma.user_Hobbies.deleteMany({ where: { userId: userId } }),
      this.prisma.user_Hobbies.createMany({ data: dataToCreate }),
    ]);

    return { success: true };
  }

  async updateUsername(userId: string, username: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { username },
      select: { id: true, email: true, username: true, updatedAt: true },
    });
    return user;
  }

  async updatePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: true } | { success: false; error: string }> {
    if (oldPassword === newPassword)
      return {
        success: false,
        error: "기존 비밀번호는 사용하실 수 없습니다.",
      };
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });
    if (!user) return { success: false, error: "사용자를 찾을 수 없습니다." };
    const bcrypt = await import("bcrypt");
    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok)
      return { success: false, error: "기존 비밀번호가 일치하지 않습니다." };
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
    return { success: true };
  }

  async getPublicUsers(ids: string[], currentUserId: string) {
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      include: {
        hobbies: { include: { hobby: true } },
        location: { select: { latitude: true, longitude: true } },
      },
    });

    const myHobbies = await this.prisma.user_Hobbies.findMany({
      where: { userId: currentUserId },
      select: { hobbyId: true },
    });
    const myHobbyIds = new Set(myHobbies.map((h) => h.hobbyId));

    return users.map((u) => {
      const hobbies = u.hobbies.map((h) => h.hobby.name);
      const commonHobbies = u.hobbies
        .filter((h) => myHobbyIds.has(h.hobbyId))
        .map((h) => h.hobby.name);
      return {
        id: u.id,
        email: u.email,
        username: u.username,
        hobbies,
        commonHobbies,
        latitude: u.location?.latitude ?? null,
        longitude: u.location?.longitude ?? null,
      };
    });
  }
}
