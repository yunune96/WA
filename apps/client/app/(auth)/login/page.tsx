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
        <div className={styles.formContainer}>
          <div key={`form-${view}`} className={styles.formWrapper}>
            {view === "login" ? (
              <LoginForm key={`login-${formVersion}`} />
            ) : (
              <SignupForm key={`signup-${formVersion}`} />
            )}
          </div>
        </div>

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
