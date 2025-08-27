import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../core/database/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterUserDto } from "./dto/register-user.dto";
interface LoginResponse {
    accessToken: string;
    user: {
        id: string;
        email: string;
        username: string | null;
        needsOnboarding: boolean;
    };
}
interface RegisterResponse {
    id: string;
    email: string;
    username: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(registerUserDto: RegisterUserDto): Promise<RegisterResponse>;
    login(loginDto: LoginDto): Promise<LoginResponse>;
}
export {};
