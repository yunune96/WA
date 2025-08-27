import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

import { PrismaService } from "../core/database/prisma.service";
import { MailerService } from "../core/mailer/mailer.service";
import { RedisService } from "../core/redis/redis.service";
import { SignupRequestDto } from "./dto/signup-request.dto";

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

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailer: MailerService,
    private redis: RedisService
  ) {}

  async register(registerUserDto: RegisterUserDto): Promise<RegisterResponse> {
    const { email, password, username } = registerUserDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException("이미 사용 중인 이메일입니다.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
      },
    });

    const { password: _password, ...result } = user;

    // 이메일 인증 토큰 생성 및 발송
    const emailToken = this.jwtService.sign(
      { sub: result.id, email: result.email, purpose: "email-verify" },
      { expiresIn: process.env.EMAIL_VERIFY_EXPIRES_IN || "24h", secret: process.env.EMAIL_JWT_SECRET || process.env.JWT_SECRET }
    );
    const frontend = process.env.FRONTEND_URL || "http://localhost:3000";
    const verifyUrl = `${frontend}/verify-email/callback?token=${encodeURIComponent(
      emailToken
    )}`;
    try {
      await this.mailer.sendEmailVerification(result.email, verifyUrl);
    } catch (e) {
      // 메일 실패하더라도 가입 자체는 완료되므로 로깅만
      console.error("sendEmailVerification failed", e);
    }
    return result;
  }

  // 이메일 인증 후 최종 가입 방식: 1) 요청을 Redis에 저장하고 2) 인증 링크 전송
  async signupRequest(dto: SignupRequestDto): Promise<void> {
    const { email, password, username } = dto;
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException("이미 사용 중인 이메일입니다.");
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const token = this.jwtService.sign(
      { email, purpose: "signup" },
      {
        expiresIn: process.env.SIGNUP_VERIFY_EXPIRES_IN || "5m",
        secret: process.env.EMAIL_JWT_SECRET || process.env.JWT_SECRET,
      }
    );
    const ttl = 60 * 5; // 5 minutes for signup window
    await this.redis.setex(
      `signup:${token}`,
      ttl,
      JSON.stringify({ email, passwordHash, username })
    );
    // 이메일로도 조회 가능하도록 별도 키 저장(재발송 지원)
    await this.redis.setex(
      `signup:email:${email}`,
      ttl,
      JSON.stringify({ email, passwordHash, username })
    );
    const frontend = process.env.FRONTEND_URL || "http://localhost:3000";
    const verifyUrl = `${frontend}/verify-email/callback?token=${encodeURIComponent(
      token
    )}`;
    try {
      await this.mailer.sendEmailVerification(email, verifyUrl);
    } catch (e) {
      console.error("sendEmailVerification(signup) failed", e);
    }
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        hobbies: {
          include: {
            hobby: true,
          },
        },
        _count: {
          select: { hobbies: true },
        },
      },
    });


    if (!user) {
      throw new UnauthorizedException("이메일 또는 비밀번호를 확인해주세요.");
    }

    const isPasswordValidated = await bcrypt.compare(password, user.password);

    if (!isPasswordValidated) {
      throw new UnauthorizedException("이메일 또는 비밀번호를 확인해주세요.");
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException("이메일 인증이 필요합니다.");
    }

    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);

    const needsOnboarding = user._count.hobbies === 0;

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        needsOnboarding: needsOnboarding,
      },
    };
  }

  async resendVerification(email: string): Promise<void> {
    // 5분 레이트리밋 (이메일 기준)
    const rlKey = `rl:verify-resend:${email}`;
    if ((await this.redis.exists(rlKey)) === 1) {
      throw new HttpException("5분 후 다시 시도해주세요.", HttpStatus.TOO_MANY_REQUESTS);
    }
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // 사용자 존재 여부 노출 방지
    if (user.isEmailVerified) return;
    const token = this.jwtService.sign(
      { sub: user.id, email: user.email, purpose: "email-verify" },
      { expiresIn: process.env.EMAIL_VERIFY_EXPIRES_IN || "24h", secret: process.env.EMAIL_JWT_SECRET || process.env.JWT_SECRET }
    );
    const frontend = process.env.FRONTEND_URL || "http://localhost:3000";
    const verifyUrl = `${frontend}/verify-email/callback?token=${encodeURIComponent(
      token
    )}`;
    try {
      await this.mailer.sendEmailVerification(user.email, verifyUrl);
    } catch (e) {
      // 재발송 실패는 500을 내지 않고 서버에만 기록
      console.error("resendVerification mail failed", e);
    }
    // 다음 요청까지 5분 대기
    await this.redis.setex(rlKey, 300, "1");
  }

  async signupResend(email: string): Promise<void> {
    // 5분 레이트리밋(재발송)
    const rlKey = `rl:signup-resend:${email}`;
    if ((await this.redis.exists(rlKey)) === 1) {
      throw new HttpException("5분 후 다시 시도해주세요.", HttpStatus.TOO_MANY_REQUESTS);
    }
    const raw = await this.redis.get(`signup:email:${email}`);
    if (!raw) {
      // 대기 중인 가입 요청이 없음
      throw new HttpException("인증 대기 요청이 없습니다.", HttpStatus.BAD_REQUEST);
    }
    const payload = JSON.parse(raw) as {
      email: string;
      passwordHash: string;
      username: string;
    };
    const token = this.jwtService.sign(
      { email, purpose: "signup" },
      {
        expiresIn: process.env.SIGNUP_VERIFY_EXPIRES_IN || "5m",
        secret: process.env.EMAIL_JWT_SECRET || process.env.JWT_SECRET,
      }
    );
    const ttl = 60 * 5;
    await this.redis.setex(`signup:${token}`, ttl, JSON.stringify(payload));
    await this.redis.setex(`signup:email:${email}`, ttl, JSON.stringify(payload));
    const frontend = process.env.FRONTEND_URL || "http://localhost:3000";
    const verifyUrl = `${frontend}/verify-email/callback?token=${encodeURIComponent(
      token
    )}`;
    try {
      await this.mailer.sendEmailVerification(email, verifyUrl);
    } catch (e) {
      console.error("sendEmailVerification(signupResend) failed", e);
    }
    await this.redis.setex(rlKey, 300, "1");
  }

  async verifyEmailTokenAndRedirect(token: string): Promise<string> {
    const frontend = process.env.FRONTEND_URL || "http://localhost:3000";
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.EMAIL_JWT_SECRET || process.env.JWT_SECRET,
      });
      // 두 가지 토큰을 모두 처리: 1) 가입 완료 2) 기존 가입 이메일 인증
      if (payload?.purpose === "signup") {
        const raw = await this.redis.get(`signup:${token}`);
        if (!raw) return `${frontend}/verify-email/invalid`;
        const data = JSON.parse(raw) as {
          email: string;
          passwordHash: string;
          username: string;
        };
        // 중복 체크(경합 대비)
        const exists = await this.prisma.user.findUnique({
          where: { email: data.email },
        });
        if (!exists) {
          await this.prisma.user.create({
            data: {
              email: data.email,
              password: data.passwordHash,
              username: data.username,
              isEmailVerified: true,
            },
          });
        } else if (!exists.isEmailVerified) {
          await this.prisma.user.update({
            where: { id: exists.id },
            data: { isEmailVerified: true },
          });
        }
        await this.redis.del(`signup:${token}`);
        await this.redis.del(`signup:email:${data.email}`);
        return `${frontend}/verify-email/success`;
      }
      if (payload?.purpose === "email-verify" && payload?.sub) {
        await this.prisma.user.update({
          where: { id: payload.sub },
          data: { isEmailVerified: true },
        });
        return `${frontend}/verify-email/success`;
      }
      return `${frontend}/verify-email/invalid`;
    } catch (e) {
      return `${frontend}/verify-email/invalid`;
    }
  }
}
