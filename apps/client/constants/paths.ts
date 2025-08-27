// routes.ts
// 앱 전역에서 사용하는 경로 상수와 보호 라우트 목록을 관리합니다.
// - ROUTES: 라우팅 경로 문자열을 한 곳에서 관리하여 오타/변경 비용을 줄입니다.
// - PROTECTED_ROUTES: 미들웨어 및 클라이언트 훅(useRequireAuth)에서 공통으로 참조 가능한 보호 경로 목록입니다.
export const ROUTES = {
  home: "/",
  login: "/login",
  profile: "/profile",
  map: "/map",
  matches: "/matches",
  chat: "/chat",
} as const;

export const PROTECTED_ROUTES = [
  ROUTES.map,
  ROUTES.matches,
  ROUTES.profile,
  ROUTES.chat,
] as const;


