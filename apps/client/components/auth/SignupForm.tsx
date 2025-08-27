"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { authApi } from "@/lib/api";
import { useModalStore } from "@/store/modalStore";
import styles from "@/styles/Auth.module.css";

interface SignupFormData {
  email: string;
  username: string;
  password: string;
}

export default function SignupForm() {
  const [formData, setFormData] = useState<SignupFormData>({
    email: "",
    username: "",
    password: "",
  });
  const router = useRouter();
  const { show: showAlert } = useModalStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await authApi.signupRequest(
        formData.email,
        formData.password,
        formData.username
      );

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data) {
        showAlert("이메일 인증을 진행해주세요. 인증 후 가입이 완료됩니다.");
        // 5분 내 미인증 시 만료되도록 데드라인 저장(클라이언트 표시용)
        try {
          const until = Date.now() + 5 * 60 * 1000;
          localStorage.setItem(
            `signupDeadline:${formData.email}`,
            String(until)
          );
        } catch(e) {
          console.error(e);
        }
        setFormData({ email: "", username: "", password: "" });
        router.replace(
          `/verify-email?email=${encodeURIComponent(formData.email)}`
        );
      }
    } catch (err) {
      showAlert(
        err instanceof Error ? err.message : "회원가입에 실패했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.authForm}>
      <h2 className={styles.formTitle}>회원가입</h2>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div>
        <label htmlFor="signup-email">이메일</label>
        <input
          type="email"
          id="signup-email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className={styles.inputField}
          required
        />
      </div>
      <div>
        <label htmlFor="nickname">닉네임</label>
        <input
          type="text"
          id="nickname"
          name="username"
          value={formData.username}
          onChange={handleInputChange}
          className={styles.inputField}
          required
        />
      </div>
      <div>
        <label htmlFor="signup-password">비밀번호</label>
        <input
          type="password"
          id="signup-password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          className={styles.inputField}
          required
        />
      </div>
      <button
        type="submit"
        className={`${styles.submitButton} ${styles.signupButton}`}
        disabled={isLoading}
      >
        {isLoading ? "가입하는 중..." : "회원가입"}
      </button>
    </form>
  );
}
