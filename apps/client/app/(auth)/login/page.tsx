"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import styles from "@/styles/Auth.module.css";

export default function LoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [formVersion, setFormVersion] = useState(0);

  const view = useMemo<"login" | "signup">(() => {
    const tab = searchParams.get("tab");
    return tab === "signup" ? "signup" : "login";
  }, [searchParams]);

  useEffect(() => {
    setFormVersion((v) => v + 1);
  }, [view]);

  return (
    <div className={styles.authPageContainer}>
      <div
        className={`${styles.authCard} ${
          view === "login"
            ? styles.cardEnterFromLeft
            : styles.cardEnterFromRight
        }`}
      >
        <div
          className={
            `${styles.formContainer} ` +
            (view === "signup"
              ? styles.formContainerSignup
              : styles.formContainerLogin)
          }
        >
          <div key={`form-${view}`} className={styles.formWrapper}>
            {view === "login" ? (
              <LoginForm key={`login-${formVersion}`} />
            ) : (
              <SignupForm key={`signup-${formVersion}`} />
            )}
          </div>
        </div>

        {view === "login" ? (
          <div className={styles.socialSection}>
            <div className={styles.socialDivider}>
              <span className={styles.socialDividerText}>또는</span>
            </div>
            <div className={styles.socialButtons}>
              <button
                type="button"
                className={`${styles.socialBtn} ${styles.googleBtn}`}
                onClick={() => {
                  const base = process.env.NEXT_PUBLIC_API_URL || "";
                  const href = base
                    ? `${base}/api/auth/google`
                    : "/api/auth/google";
                  window.location.href = href;
                }}
                aria-label="구글로 로그인"
              >
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
                  <path
                    fill="#FFC107"
                    d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 s5.373-12,12-12c3.059,0,5.842,1.155,7.961,3.039l5.657-5.657C33.531,6.053,29.043,4,24,4C12.955,4,4,12.955,4,24 s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                  />
                  <path
                    fill="#FF3D00"
                    d="M6.306,14.691l6.571,4.819C14.655,16.108,18.961,13,24,13c3.059,0,5.842,1.155,7.961,3.039l5.657-5.657 C33.531,6.053,29.043,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                  />
                  <path
                    fill="#4CAF50"
                    d="M24,44c5.166,0,9.86-1.977,13.409-5.197l-6.191-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                  />
                  <path
                    fill="#1976D2"
                    d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.095,5.565 c0.001-0.001,0.002-0.001,0.003-0.002l6.191,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                  />
                </svg>
                <span>Google로 로그인</span>
              </button>
              <button
                type="button"
                className={`${styles.socialBtn} ${styles.kakaoBtn}`}
                onClick={() => {
                  const base = process.env.NEXT_PUBLIC_API_URL || "";
                  const href = base
                    ? `${base}/api/auth/kakao`
                    : "/api/auth/kakao";
                  window.location.href = href;
                }}
                aria-label="카카오로 로그인"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="#3C1E1E"
                    d="M12 3C6.477 3 2 6.477 2 10.773c0 2.413 1.555 4.535 3.929 5.86L5 21l4.03-2.239c.922.209 1.905.322 2.97.322c5.523 0 10-3.477 10-7.773C22 6.477 17.523 3 12 3"
                  />
                </svg>
                <span>카카오로 로그인</span>
              </button>
            </div>
          </div>
        ) : null}

        <div className={styles.togglePrompt}>
          {view === "login" ? (
            <p>
              계정이 없으신가요?{" "}
              <button
                onClick={() => {
                  router.replace(`${pathname}?tab=signup`);
                }}
                className={`${styles.toggleButton} ${styles.toggleButtonSignup}`}
              >
                회원가입
              </button>
            </p>
          ) : (
            <p>
              이미 계정이 있으신가요?{" "}
              <button
                onClick={() => {
                  router.replace(`${pathname}?tab=login`);
                }}
                className={`${styles.toggleButton} ${styles.toggleButtonLogin}`}
              >
                로그인
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
