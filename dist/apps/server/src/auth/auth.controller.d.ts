import { AuthService } from "./auth.service";
import { RegisterUserDto } from "./dto/register-user.dto";
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerUserDto: RegisterUserDto): Promise<any>;
    login(loginDto: any): Promise<{
        accessToken: string;
    }>;
}
//# sourceMappingURL=auth.controller.d.ts.map