import { ConfigService } from "@nestjs/config";
import { Strategy } from "passport-jwt";
import { PrismaService } from "../../core/database/prisma.service";
import { UserWithoutPassword } from "../../shared/types/user.types";
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly prisma;
    private readonly configService;
    constructor(prisma: PrismaService, configService: ConfigService);
    validate(payload: {
        sub: string;
        email: string;
    }): Promise<UserWithoutPassword>;
}
export {};
