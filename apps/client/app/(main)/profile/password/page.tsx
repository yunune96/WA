"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { userApi } from "@/lib/api";
import { useModalStore } from "@/store/modalStore";
import styles from "@/styles/Profile.module.css";

export default function PasswordChangePage() {
  const router = useRouter();
  const show = useModalStore((s) => s.show);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const isValid = () => {
    if (!oldPassword || !newPassword || !confirmPassword) return false;
    if (newPassword.length < 8) return false;
    if (newPassword !== confirmPassword) return false;
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid()) {
      show("비밀번호를 정확히 입력하세요 (8자 이상, 중복확인 일치)");
      return;
    }
    setSaving(true);
    const res = await userApi.updateMyPassword(oldPassword, newPassword);
    setSaving(false);
    if (res.error || res.data?.success === false) {
      const msg = res.error ?? res.data?.error ?? "변경 실패";
      show(msg);
      return;
    }
    show("비밀번호가 변경되었습니다.", () => router.replace("/profile"));
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>비밀번호 변경</h1>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label>
            <div>현재 비밀번호</div>
            <input
              type="password"
              className={styles.textInput}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </label>
          <label>
            <div>새 비밀번호 (8자 이상)</div>
            <input
              type="password"
              className={styles.textInput}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </label>
          <label>
            <div>새 비밀번호 확인</div>
            <input
              type="password"
              className={styles.textInput}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className={styles.btn}
              onClick={() => router.back()}
            >
              취소
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={saving || !isValid()}
            >
              {saving ? "변경 중..." : "변경"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
