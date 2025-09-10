import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Res,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import type { Response, CookieOptions } from "express";

import { UserWithoutPassword } from "../shared/types/user.types";

import { AuthService } from "./auth.service";
import { User } from "./decorators/user.decorator";
import { LoginDto } from "./dto/login.dto";
import { RegisterUserDto } from "./dto/register-user.dto";
import { SignupRequestDto } from "./dto/signup-request.dto";

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

@ApiTags("인증")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("/register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "회원가입" })
  @ApiResponse({
    status: 201,
    description: "회원가입 성공",
    type: Object,
  })
  @ApiResponse({
    status: 409,
    description: "이미 사용 중인 이메일",
  })
  async register(
    @Body() registerUserDto: RegisterUserDto
  ): Promise<RegisterResponse> {
    return this.authService.register(registerUserDto);
  }

  @Post("/signup-request")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "회원가입 요청(이메일 인증 후 실제 가입)" })
  async signupRequest(@Body() body: SignupRequestDto) {
    await this.authService.signupRequest(body);
    return { ok: true };
  }

  @Post("/login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "로그인" })
  @ApiResponse({
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
  })
  @ApiResponse({
    status: 401,
    description: "이메일 또는 비밀번호 오류",
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<LoginResponse> {
    const result = await this.authService.login(loginDto);

    const sessionCookie = process.env.SESSION_COOKIE === "true";
    const cookieOptions: CookieOptions = {
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

  @Post("/logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "로그아웃 (쿠키 삭제)" })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("accessToken", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      // domain: "localhost",
    });
    return { success: true };
  }

  // Google OAuth 시작 -> 콜백
  @Get("/google")
  @UseGuards(AuthGuard("google"))
  @ApiOperation({ summary: "구글 로그인 시작" })
  authGoogle() {
    return true;
  }

  @Get("/google/callback")
  @UseGuards(AuthGuard("google"))
  @ApiOperation({ summary: "구글 로그인 콜백" })
  async googleCallback(
    @User() user: { email: string; username?: string | null },
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.oauthLogin({
      provider: "google",
      email: user.email,
      username: user.username ?? null,
    });
    const cookieOptions: CookieOptions = {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production" ? true : false,
      path: "/",
    };
    res.cookie("accessToken", result.accessToken, cookieOptions);
    const frontend = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(`${frontend}`);
  }

  // Kakao OAuth 시작 -> 콜백
  @Get("/kakao")
  @UseGuards(AuthGuard("kakao"))
  @ApiOperation({ summary: "카카오 로그인 시작" })
  authKakao() {
    return true;
  }

  @Get("/kakao/callback")
  @UseGuards(AuthGuard("kakao"))
  @ApiOperation({ summary: "카카오 로그인 콜백" })
  async kakaoCallback(
    @User() user: { email: string; username?: string | null },
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.oauthLogin({
      provider: "kakao",
      email: user.email,
      username: user.username ?? null,
    });
    const cookieOptions: CookieOptions = {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production" ? true : false,
      path: "/",
    };
    res.cookie("accessToken", result.accessToken, cookieOptions);
    const frontend = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(`${frontend}`);
  }

  @Get("/verify")
  @UseGuards(AuthGuard("jwt"))
  @ApiOperation({ summary: "토큰 검증 및 사용자 정보 반환" })
  verifyToken(@User() user: UserWithoutPassword) {
    return user;
  }

  @Post("/signup/resend")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "회원가입 인증 메일 재발송(대기 상태 갱신)" })
  async signupResend(@Body() body: { email: string }) {
    await this.authService.signupResend(body.email);
    return { ok: true };
  }

  @Get("/verify-email")
  @ApiOperation({ summary: "이메일 인증 처리" })
  async verifyEmail(@Res() res: Response, @Body() _?: unknown) {
    const token = (res.req.query?.token as string) || "";
    const redirectUrl = await this.authService.verifyEmailTokenAndRedirect(
      token
    );
    return res.redirect(redirectUrl);
  }
}
