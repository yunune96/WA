"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationsService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
const prisma_service_1 = require("../core/database/prisma.service");
let LocationsService = class LocationsService {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async findNearbyUsers(currentUserId, radiusMeters = 500) {
        const currentUserHobbies = await this.prisma.user_Hobbies.findMany({
            where: { userId: currentUserId },
            select: { hobbyId: true },
        });
        if (currentUserHobbies.length === 0) {
            return [];
        }
        const currentUserHobbyIds = currentUserHobbies.map((h) => h.hobbyId);
        const inclusiveRadius = Math.max(0, radiusMeters) + 1; // 1m 버퍼로 경계 포함
        const nearbyUsersData = (await this.redis.georadiusbymember("user_locations", currentUserId, inclusiveRadius, "m", "WITHDIST", "ASC"));
        const userDistances = {};
        if (nearbyUsersData && nearbyUsersData.length > 0) {
            nearbyUsersData.forEach(([id, dist]) => {
                userDistances[id] = Math.min(userDistances[id] ?? Number.POSITIVE_INFINITY, parseFloat(dist));
            });
        }
        const me = await this.prisma.user_Location.findUnique({
            where: { userId: currentUserId },
            select: { latitude: true, longitude: true },
        });
        if (me) {
            const rows = (await this.prisma.$queryRawUnsafe(`
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
      `, me.longitude, me.latitude, currentUserId, inclusiveRadius));
            rows.forEach((r) => {
                userDistances[r.userId] = Math.min(userDistances[r.userId] ?? Number.POSITIVE_INFINITY, r.distance);
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
};
exports.LocationsService = LocationsService;
exports.LocationsService = LocationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)("REDIS_CLIENT")),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ioredis_1.Redis])
], LocationsService);
//# sourceMappingURL=locations.service.js.map