import { Redis } from "ioredis";
import { PrismaService } from "../core/database/prisma.service";
export declare class LocationsService {
    private readonly prisma;
    private readonly redis;
    constructor(prisma: PrismaService, redis: Redis);
    findNearbyUsers(currentUserId: string, radiusMeters?: number): Promise<{
        hobbies: string[];
        commonHobbies: string[];
        distance: string;
        latitude: number | null;
        longitude: number | null;
        location: {
            latitude: number;
            longitude: number;
        } | null;
        id: string;
        email: string;
        username: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
}
