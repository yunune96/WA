import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { RegisterUserDto } from "./dto/register-user.dto";
import { UpdateAuthDto } from "./dto/update-auth.dto";
import { PrismaService } from "../core/database/prisma.service";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async register(registerUserDto: RegisterUserDto) {
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

    // result 객체에 password 부분만 무시
    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException("이메일 또는 비밀번호를 확인해주세요.");
    }

    const isPasswordValidated = await bcrypt.compare(password, user.password);

    if (!isPasswordValidated) {
      throw new UnauthorizedException("이메일 또는 비밀번호를 확인해주세요.");
    }

    const payload = { email: user.email, sub: user.id };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
