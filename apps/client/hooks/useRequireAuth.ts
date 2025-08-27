"use client";
// useRequireAuth
// 클라이언트 보호 라우트에서 인증 여부를 확인하고, 미인증 시 로그인 페이지로 리다이렉트합니다.
// - initialize()를 보장해 초기화 선행
// - hasInitialized && !isLoggedIn → /login?redirect_to=현재위치 로 이동
// - ready 플래그를 반환해 페이지가 데이터 로드 타이밍을 제어하도록 지원
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { ROUTES } from "@/constants/paths";
import { REDIRECT_TO_PARAM } from "@/constants/query";
import { useAuthStore } from "@/store/authStore";

export function useRequireAuth() {
  const router = useRouter();
  const { isLoggedIn, hasInitialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!hasInitialized) return;
    if (!isLoggedIn) {
      try {
        const current = window.location.pathname + window.location.search;
        const url = `${ROUTES.login}?${REDIRECT_TO_PARAM}=${encodeURIComponent(
          current
        )}`;
        router.replace(url);
      } catch {
        router.replace(ROUTES.login);
      }
    }
  }, [hasInitialized, isLoggedIn, router]);

  return useMemo(
    () => ({ ready: hasInitialized && isLoggedIn }),
    [hasInitialized, isLoggedIn]
  );
}
