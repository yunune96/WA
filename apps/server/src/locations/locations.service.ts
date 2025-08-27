import { Injectable, Inject } from "@nestjs/common";
import { Redis } from "ioredis";

import { PrismaService } from "../core/database/prisma.service";

@Injectable()
export class LocationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject("REDIS_CLIENT") private readonly redis: Redis
  ) {}

  async findNearbyUsers(currentUserId: string, radiusMeters: number = 500) {
    const currentUserHobbies = await this.prisma.user_Hobbies.findMany({
      where: { userId: currentUserId },
      select: { hobbyId: true },
    });
    if (currentUserHobbies.length === 0) {
      return [];
    }
    const currentUserHobbyIds = currentUserHobbies.map((h) => h.hobbyId);

    const inclusiveRadius = Math.max(0, radiusMeters) + 1; // 1m 버퍼로 경계 포함

    const nearbyUsersData = (await this.redis.georadiusbymember(
      "user_locations",
      currentUserId,
      inclusiveRadius,
      "m",
      "WITHDIST",
      "ASC"
    )) as [string, string][];

    const userDistances: { [key: string]: number } = {};
    if (nearbyUsersData && nearbyUsersData.length > 0) {
      nearbyUsersData.forEach(([id, dist]) => {
        userDistances[id] = Math.min(
          userDistances[id] ?? Number.POSITIVE_INFINITY,
          parseFloat(dist)
        );
      });
    }

    const me = await this.prisma.user_Location.findUnique({
      where: { userId: currentUserId },
      select: { latitude: true, longitude: true },
    });
    if (me) {
      const rows = (await this.prisma.$queryRawUnsafe(
        `
        SELECT ul."userId",
               public.ST_DistanceSphere(
                 public.ST_SetSRID(public.ST_MakePoint(ul."longitude", ul."latitude"),4326),
                 public.ST_SetSRID(public.ST_MakePoint($1, $2),4326)
               ) AS distance
        FROM "User_Location" ul
        WHERE ul."userId" <> $3
          AND public.ST_DWithin(
                public.ST_SetSRID(public.ST_MakePoint(ul."longitude", ul."latitude"),4326)::public.geography,
                public.ST_SetSRID(public.ST_MakePoint($1, $2),4326)::public.geography,
                $4
              )
        ORDER BY distance ASC
        LIMIT 200
      `,
        me.longitude,
        me.latitude,
        currentUserId,
        inclusiveRadius
      )) as Array<{ userId: string; distance: number }>;

      rows.forEach((r) => {
        userDistances[r.userId] = Math.min(
          userDistances[r.userId] ?? Number.POSITIVE_INFINITY,
          r.distance
        );
      });
    }

    const nearbyUserIds = Object.keys(userDistances);

    const matchedUsers = await this.prisma.user.findMany({
      where: {
        id: { in: nearbyUserIds },
        NOT: {
          id: currentUserId,
        },
        hobbies: {
          some: {
            hobbyId: {
              in: currentUserHobbyIds,
            },
          },
        },
      },
      include: {
        hobbies: {
          include: {
            hobby: true,
          },
        },
        location: {
          select: { latitude: true, longitude: true },
        },
      },
    });

    const result = matchedUsers.map((user) => {
      const { password: _, ...safeUser } = user;
      const userHobbies = user.hobbies.map((h) => h.hobby.name);

      const commonHobbies = user.hobbies
        .filter((h) => currentUserHobbyIds.includes(h.hobbyId))
        .map((h) => h.hobby.name);

      return {
        ...safeUser,
        hobbies: userHobbies,
        commonHobbies,
        distance: (userDistances[user.id] ?? 0).toFixed(2),
        latitude: user.location?.latitude ?? null,
        longitude: user.location?.longitude ?? null,
      };
    });

    return result;
  }
}
