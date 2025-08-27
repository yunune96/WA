"use client";
import { useRouter } from "next/navigation";
import styles from "@/styles/Auth.module.css";

export default function VerifySuccessPage() {
  const router = useRouter();
  return (
    <div className={styles.authPageContainer}>
      <div className={styles.authCard}>
        <div className={styles.formContainer}>
          <div className={styles.formWrapper}>
            <h2 className={styles.formTitle}>이메일 인증 완료</h2>
            <p>이제 로그인하실 수 있어요.</p>
            <button className={styles.loginButton} onClick={() => router.push("/login")}>로그인</button>
          </div>
        </div>
      </div>
    </div>
  );
}


