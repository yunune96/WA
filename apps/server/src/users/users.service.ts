import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Redis } from "ioredis";

import { PrismaService } from "../core/database/prisma.service";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject("REDIS_CLIENT") private readonly redis: Redis
  ) {}

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

      await this.redis.geoadd("user_locations", longitude, latitude, userId);
      await this.redis.zadd("user_last_seen", Date.now().toString(), userId);

      console.log(
        `[Redis] 사용자 위치 업데이트: ${userId} -> (${longitude}, ${latitude})`
      );
      return { success: true };
    } catch (error) {
      console.error("Redis 위치 업데이트 실패:", error);
      throw new InternalServerErrorException(
        "사용자 위치 업데이트에 실패했습니다."
      );
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
