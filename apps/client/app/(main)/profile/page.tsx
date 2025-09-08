"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { userApi, coinsApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import styles from "@/styles/Profile.module.css";
import type { UserWithoutPassword } from "@/types/user.types";
type MyProfile = Pick<UserWithoutPassword, "id" | "email" | "username">;

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const _hasInitialized = useAuthStore((s) => s.hasInitialized);
  const initialize = useAuthStore((s) => s.initialize);
  const { ready } = useRequireAuth();
  const [me, setMe] = useState<MyProfile | null>(
    user ? { id: user.id, email: user.email, username: user.username } : null
  );
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoggedIn) {
      setMe(null);
      setHobbies([]);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!ready || !isLoggedIn || !user?.id) return;
    (async () => {
      try {
        const res = await userApi.getMe();
        if (res.data) {
          setMe(res.data as MyProfile);
          setNewName((res.data as MyProfile).username ?? "");
        } else {
          setMe(null);
        }
      } catch (e) {
        console.warn("getMe failed", e);
        setMe(null);
      }
      try {
        const pub = await userApi.getUsersPublic([user.id]);
        const mine = pub.data?.find((u) => u.id === user.id);
        setHobbies(mine?.hobbies ?? []);
      } catch (e) {
        console.warn("getUsersPublic failed", e);
        setHobbies([]);
      }
      try {
        const b = await coinsApi.getBalance();
        if (!b.error) setBalance(b.data!.balance);
      } catch (e) {
        console.warn("getBalance failed", e);
        setBalance(null);
      }
    })();
  }, [ready, isLoggedIn, user?.id]);

  const saveNickname = async () => {
    if (!newName.trim()) return alert("닉네임을 입력하세요");
    setSaving(true);
    const res = await userApi.updateMyUsername(newName.trim());
    setSaving(false);
    if (res.error) return alert("닉네임 변경 실패: " + res.error);
    setMe((prev) => (prev ? { ...prev, username: newName.trim() } : prev));
    setEditing(false);
  };

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>내 정보</h1>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.nameRow}>
            {editing ? (
              <div className={styles.inlineEdit}>
                <input
                  className={styles.textInput}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={30}
                />
                <button
                  className={styles.btnPrimary}
                  onClick={saveNickname}
                  disabled={saving}
                >
                  저장
                </button>
                <button
                  className={styles.btn}
                  onClick={() => setEditing(false)}
                >
                  취소
                </button>
              </div>
            ) : (
              <>
                <div className={styles.displayName}>
                  {me?.username ?? "(미설정)"}
                </div>
                <span
                  className={styles.editIcon}
                  onClick={() => setEditing(true)}
                  title="닉네임 수정"
                >
                  ✎
                </span>
              </>
            )}
          </div>
          <div className={styles.email}>{me?.email ?? "-"}</div>
        </div>
        <div className={styles.sectionTitle}>🔍관심사</div>
        <div className={styles.balanceRow} title="코인 잔액">
          💰 코인 잔액 : {balance === null ? "-" : `${balance} 코인`}
        </div>
        <div className={styles.divider} />
        
        {hobbies.length ? (
          <div className={styles.chipGrid}>
            {hobbies.map((h, i) => (
              <span key={`${h}-${i}`} className={styles.chip}>
                {h}
              </span>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>관심사 없음</div>
        )}
        <div className={styles.actions}>
          <button
            className={styles.btn}
            onClick={() => router.push("/profile/password")}
          >
            비밀번호 변경
          </button>
          <button
            className={styles.btnPrimary}
            onClick={() =>
              router.push(
                user?.id
                  ? `/select-hobbies?userId=${encodeURIComponent(
                      user.id
                    )}&redirect_to=${encodeURIComponent("/profile")}`
                  : "/login"
              )
            }
          >
            관심사 수정
          </button>
        </div>
      </div>
    </div>
  );
}
