"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuthStore } from "@/store/authStore";
import { useModalStore } from "@/store/modalStore";
import styles from "@/styles/Header.module.css";

export default function Header() {
  const { isLoggedIn, logout, initialize } = useAuthStore();
  const { show: showAlert } = useModalStore();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.error(e);
    }
    logout();
    showAlert("로그아웃 되었습니다.");
    router.replace("/");
  };

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link href="/">🌏Without Alone</Link>
      </div>
      <nav className={styles.navigation}>
        {isLoggedIn ? (
          <button onClick={handleLogout} className={styles.authButton}>
            로그아웃
          </button>
        ) : (
          <button
            onClick={() => router.push("/login")}
            className={styles.authButton}
          >
            로그인
          </button>
        )}
      </nav>
    </header>
  );
}
