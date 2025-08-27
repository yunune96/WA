import type { Response } from "express";
import { UserWithoutPassword } from "../shared/types/user.types";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterUserDto } from "./dto/register-user.dto";
interface LoginResponse {
    accessToken: string;
}
interface RegisterResponse {
    id: string;
    email: string;
    username: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerUserDto: RegisterUserDto): Promise<RegisterResponse>;
    login(loginDto: LoginDto, res: Response): Promise<LoginResponse>;
    logout(res: Response): {
        success: boolean;
    };
    verifyToken(user: UserWithoutPassword): UserWithoutPassword;
}
export {};
