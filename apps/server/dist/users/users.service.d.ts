import { Redis } from "ioredis";
import { PrismaService } from "../core/database/prisma.service";
export declare class UsersService {
    private readonly prisma;
    private readonly redis;
    constructor(prisma: PrismaService, redis: Redis);
    findMyProfile(userId: string): Promise<{
        id: string;
        email: string;
        username: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateUserLocation(userId: string, latitude: number, longitude: number): Promise<{
        success: boolean;
    }>;
    selectHobbies(userId: string, hobbyIds: number[]): Promise<{
        success: boolean;
    }>;
}
