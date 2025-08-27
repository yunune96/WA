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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const user_decorator_1 = require("./decorators/user.decorator");
const login_dto_1 = require("./dto/login.dto");
const register_user_dto_1 = require("./dto/register-user.dto");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async register(registerUserDto) {
        return this.authService.register(registerUserDto);
    }
    async login(loginDto, res) {
        const result = await this.authService.login(loginDto);
        const sessionCookie = process.env.SESSION_COOKIE === "true";
        const cookieOptions = {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production" ? true : false,
            path: "/",
        };
        if (!sessionCookie) {
            cookieOptions.maxAge = 1000 * 60 * 60 * 24 * 7; // 쿠키 유효시간
        }
        res.cookie("accessToken", result.accessToken, cookieOptions);
        return result;
    }
    logout(res) {
        res.clearCookie("accessToken", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            // domain: "localhost",
        });
        return { success: true };
    }
    verifyToken(user) {
        return user;
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)("/register"),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: "회원가입" }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: "회원가입 성공",
        type: Object,
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: "이미 사용 중인 이메일",
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_user_dto_1.RegisterUserDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)("/login"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "로그인" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "로그인 성공",
        schema: {
            type: "object",
            properties: {
                accessToken: {
                    type: "string",
                    description: "JWT 액세스 토큰",
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: "이메일 또는 비밀번호 오류",
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)("/logout"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "로그아웃 (쿠키 삭제)" }),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)("/verify"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    (0, swagger_1.ApiOperation)({ summary: "토큰 검증 및 사용자 정보 반환" }),
    __param(0, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyToken", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)("인증"),
    (0, common_1.Controller)("auth"),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map