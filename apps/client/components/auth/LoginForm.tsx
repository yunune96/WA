"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { REDIRECT_TO_PARAM } from "@/constants/query";
import { VERIFY_RETRY_DELAY_MS } from "@/constants/time";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useModalStore } from "@/store/modalStore";
import styles from "@/styles/Auth.module.css";

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginForm() {
  const { login } = useAuthStore();
  const { show: showAlert } = useModalStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
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
      const result = await login(formData.email, formData.password);

      if (result.success) {
        try {
          const verifyOnce = async () => {
            const res = await authApi.verifyToken();
            if (!res.data) throw new Error(res.error || "verify failed");
          };
          try {
            await verifyOnce();
          } catch {
            await new Promise((r) => setTimeout(r, VERIFY_RETRY_DELAY_MS));
            await verifyOnce();
          }
        } catch (e) {
          console.debug("auth warmup verify skipped", e);
        }

        const redirectTo = searchParams.get(REDIRECT_TO_PARAM);
        if (result.user.needsOnboarding) {
          router.push(`/select-hobbies?userId=${result.user.id}`);
        } else {
          showAlert("로그인 되었습니다");
          router.push("/");
        }
      } else {
        showAlert(result.error || "이메일 또는 비밀번호를 확인해주세요.");
        setFormData((prev) => ({ ...prev, password: "" }));
      }
    } catch (err) {
      console.error("An unexpected error occurred in handleSubmit:", err);
      showAlert("알 수 없는 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.authForm}>
      <h2 className={styles.formTitle}>로그인</h2>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div>
        <label htmlFor="email">이메일</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className={styles.inputField}
          required
        />
      </div>
      <div>
        <label htmlFor="password">비밀번호</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          className={styles.inputField}
          required
        />
      </div>
      <button
        type="submit"
        className={`${styles.submitButton} ${styles.loginButton}`}
        disabled={isLoading}
      >
        {isLoading ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}
