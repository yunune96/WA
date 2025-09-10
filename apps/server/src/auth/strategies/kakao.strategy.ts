import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Strategy, Profile } from "passport-kakao";

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, "kakao") {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>("KAKAO_CLIENT_ID") || "",
      clientSecret: configService.get<string>("KAKAO_CLIENT_SECRET") || undefined,
      callbackURL:
        configService.get<string>("KAKAO_CALLBACK_URL") ||
        "http://localhost:3001/api/auth/kakao/callback",
      scope: ["profile_nickname", "account_email"],
      session: false,
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: any, user?: any) => void
  ) {
    // kakao 계정 구조: profile._json.kakao_account.email, profile.username 등
    const email = (profile as any)?._json?.kakao_account?.email;
    const username = (profile as any)?.username || (profile as any)?._json?.properties?.nickname || null;
    if (!email) {
      return done(null, false);
    }
    const user = { email, username };
    return done(null, user);
  }
}


