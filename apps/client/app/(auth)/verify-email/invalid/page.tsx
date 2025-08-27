"use client";
import { useRouter } from "next/navigation";
import styles from "@/styles/Auth.module.css";

export default function VerifyInvalidPage() {
  const router = useRouter();
  return (
    <div className={styles.authPageContainer}>
      <div className={styles.authCard}>
        <div className={styles.formContainer}>
          <div className={styles.formWrapper}>
            <h2 className={styles.formTitle}>잘못되었거나 만료된 링크</h2>
            <p>인증 링크가 유효하지 않습니다. 다시 요청해주세요.</p>
            <button className={styles.signupButton} onClick={() => router.push("/verify-email")}>재발송 요청</button>
          </div>
        </div>
      </div>
    </div>
  );
}


