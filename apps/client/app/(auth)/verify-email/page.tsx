"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { authApi } from "@/lib/api";
import styles from "@/styles/Auth.module.css";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const router = useRouter();
  const email = params.get("email") || "";
  const [loading, setLoading] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [signupDeadline, setSignupDeadline] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  // 1초 간격으로 남은 시간 표시
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // 로컬스토리지에 저장된 쿨다운 복원 (브라우저 새로고침/재방문 시)
  useEffect(() => {
    if (!email) return;
    try {
      // 정책 변경: 첫 시도에는 쿨다운을 적용하지 않음
      localStorage.removeItem(`verifyCooldown:${email}`);
      // 회원가입 인증 만료시각 복원(최초 요청에서 저장했다고 가정)
      const dl = localStorage.getItem(`signupDeadline:${email}`);
      if (dl) {
        const ts = parseInt(dl, 10);
        if (!Number.isNaN(ts)) setSignupDeadline(ts);
      }
    } catch {}
  }, [email]);

  const remainingSec = useMemo(() => {
    if (!cooldownUntil) return 0;
    const diff = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
    return diff;
  }, [cooldownUntil, now]);

  const remainingLabel = useMemo(() => {
    if (remainingSec <= 0) return "";
    const m = Math.floor(remainingSec / 60)
      .toString()
      .padStart(2, "0");
    const s = (remainingSec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [remainingSec]);

  const signupRemainSec = useMemo(() => {
    if (!signupDeadline) return 0;
    const diff = Math.max(0, Math.ceil((signupDeadline - now) / 1000));
    return diff;
  }, [signupDeadline, now]);

  const signupRemainLabel = useMemo(() => {
    if (signupRemainSec <= 0) return "";
    const m = Math.floor(signupRemainSec / 60)
      .toString()
      .padStart(2, "0");
    const s = (signupRemainSec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [signupRemainSec]);

  const resend = async () => {
    setLoading(true);
    try {
      // 가입 인증 재발송: 서버에서 5분 유효시간을 리셋
      await authApi.signupResend(email);
      // 재발송 직후부터 두 타이머를 모두 5분으로 동기화
      const until = Date.now() + 5 * 60 * 1000;
      setCooldownUntil(until);
      setSignupDeadline(until);
      try {
        localStorage.setItem(`verifyCooldown:${email}`, String(until));
        localStorage.setItem(`signupDeadline:${email}`, String(until));
      } catch {}
    } catch (e) {
      // 서버 레이트리밋 시도 시 UI에서도 5분 쿨다운 시작
      const until = Date.now() + 5 * 60 * 1000;
      setCooldownUntil(until);
      if (!signupDeadline || signupDeadline < until) setSignupDeadline(until);
      try {
        localStorage.setItem(`verifyCooldown:${email}`, String(until));
        localStorage.setItem(`signupDeadline:${email}`, String(until));
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPageContainer}>
      <div className={styles.authCard}>
        <div className={styles.formContainer}>
          <div className={styles.formWrapper}>
            <h2 className={styles.formTitle}>이메일 인증이 필요합니다</h2>
            <p>입력하신 이메일 주소로 인증 메일을 보냈습니다.</p>
            <p>메일함에서 링크를 눌러 인증을 완료해주세요.</p>
            {email ? <p style={{ marginTop: 8 }}>대상 이메일: {email}</p> : null}
            {signupRemainSec > 0 ? (
              <p style={{ marginTop: 4, color: "#374151" }}>
                남은 인증 시간: <b>{signupRemainLabel}</b>
              </p>
            ) : (
              <p style={{ marginTop: 4, color: "#b91c1c" }}>
                인증 시간이 만료되었습니다. 다시 회원가입을 진행해주세요.
              </p>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
              <button onClick={() => router.push("/login")} className={`${styles.submitButton} ${styles.loginButton}`}>
                로그인으로 이동
              </button>
              <button onClick={resend} disabled={loading || remainingSec > 0} className={`${styles.submitButton} ${styles.signupButton}`}>
                {remainingSec > 0 ? `인증 메일 재발송 (${remainingLabel})` : (loading ? "재발송 중..." : "인증 메일 재발송")}
              </button>
              {remainingSec > 0 ? (
                <span style={{ color: "#6b7280", fontSize: 13 }}>재발송은 5분에 한 번 가능합니다.</span>
              ) : null}
            </div>
            <p style={{ color: "#6b7280", fontSize: 13, marginTop: 8, lineHeight: 1.4 }}>
              메일이 오지 않으면 스팸함을 확인하세요. 회사 메일은 보안 정책으로 차단될 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


