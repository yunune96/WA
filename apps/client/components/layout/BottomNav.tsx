"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useChatUnreadStore } from "@/store/chatUnreadStore";
import styles from "@/styles/BottomNav.module.css";

export default function BottomNav() {
  const perRoom = useChatUnreadStore((s) => s.perRoom);
  const total = useMemo(
    () => Object.values(perRoom).reduce((a, b) => a + (b || 0), 0),
    [perRoom]
  );
  return (
    <nav className={styles.nav}>
      <Link href="/map" className={styles.navLink}>
        <span>🗺️</span>
        <span>지도</span>
      </Link>
      <Link href="/matches" className={styles.navLink}>
        <span>🤝</span>
        <span>매칭</span>
      </Link>
      <Link href="/chat" className={styles.navLink}>
        <span style={{ position: "relative" }}>
          💬
          {total > 0 ? (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -10,
                minWidth: 16,
                height: 16,
                borderRadius: 999,
                background: "#ef4444",
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                padding: "0 4px",
              }}
            >
              {total > 99 ? "99+" : total}
            </span>
          ) : null}
        </span>
        <span>채팅</span>
      </Link>
      <Link href="/profile" className={styles.navLink}>
        <span>👤</span>
        <span>프로필</span>
      </Link>
    </nav>
  );
}
