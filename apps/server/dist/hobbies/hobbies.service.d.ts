import { PrismaService } from "../core/database/prisma.service";
export declare class HobbiesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        name: string;
        id: number;
    }[]>;
}
