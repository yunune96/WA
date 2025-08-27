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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
const prisma_service_1 = require("../core/database/prisma.service");
let UsersService = class UsersService {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async findMyProfile(userId) {
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
            throw new common_1.NotFoundException("사용자를 찾을 수 없습니다.");
        }
        return user;
    }
    async updateUserLocation(userId, latitude, longitude) {
        try {
            await this.prisma.$executeRawUnsafe(`
        INSERT INTO "User_Location" ("userId","latitude","longitude","updatedAt")
        VALUES ($1,$2,$3, now())
        ON CONFLICT ("userId") DO UPDATE
        SET "latitude"=EXCLUDED."latitude",
            "longitude"=EXCLUDED."longitude",
            "updatedAt"=now();
        `, userId, latitude, longitude);
            await this.redis.geoadd("user_locations", longitude, latitude, userId);
            await this.redis.zadd("user_last_seen", Date.now().toString(), userId);
            console.log(`[Redis] 사용자 위치 업데이트: ${userId} -> (${longitude}, ${latitude})`);
            return { success: true };
        }
        catch (error) {
            console.error("Redis 위치 업데이트 실패:", error);
            throw new common_1.InternalServerErrorException("사용자 위치 업데이트에 실패했습니다.");
        }
    }
    async selectHobbies(userId, hobbyIds) {
        // Validate that all hobbyIds exist to avoid FK violation
        const existing = await this.prisma.hobby.findMany({
            where: { id: { in: hobbyIds } },
            select: { id: true },
        });
        const existingIds = new Set(existing.map((h) => h.id));
        const invalidIds = hobbyIds.filter((id) => !existingIds.has(id));
        if (invalidIds.length > 0) {
            throw new Error(`존재하지 않는 취미 ID: ${invalidIds.join(", ")}. 먼저 취미 데이터를 시드하거나 유효한 ID를 보내세요.`);
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
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)("REDIS_CLIENT")),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ioredis_1.Redis])
], UsersService);
//# sourceMappingURL=users.service.js.map