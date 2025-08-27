import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ACCESS_TOKEN_COOKIE } from "@/constants/cookies";
import { ROUTES } from "@/constants/paths";
import { REDIRECT_TO_PARAM } from "@/constants/query";

// Next.js는 middleware의 config.matcher를 정적으로 분석하므로 스프레드/템플릿 변수 조합을 허용하지 않습니다.
// 리터럴 배열로 명시합니다.
export const config = {
  matcher: ["/map", "/matches", "/profile", "/chat/:path*"],
};

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    const loginUrl = new URL(ROUTES.login, request.url);
    loginUrl.searchParams.set(REDIRECT_TO_PARAM, request.nextUrl.pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
