"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import styles from "@/styles/Auth.module.css";

export default function VerifyCallbackPage() {
  const params = useSearchParams();
  const token = params.get("token");
  const router = useRouter();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    if (!token) {
      router.replace("/verify-email/invalid");
      return;
    }
    // 서버로 리다이렉트하는 엔드포인트 호출
    window.location.href = `/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  }, [token, router]);

  return (
    <div className={styles.authPageContainer}>
      <div className={styles.authCard}>
        <div className={styles.formContainer}>
          <div className={styles.formWrapper}>
            <h2 className={styles.formTitle}>인증 처리 중...</h2>
            {processing ? <p>잠시만 기다려주세요.</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}


