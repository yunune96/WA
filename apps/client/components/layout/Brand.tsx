"use client";
import styles from "@/styles/Home.module.css";

export default function Brand() {
  return (
    <div className={styles.brand} aria-label="WithoutAlone brand">
      <div className={styles.logo}>🌏 Without Alone</div>
      <div className={styles.tagline}>함께하는 취미, 지금 시작하세요</div>
      <svg
        className={styles.wave}
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="waWave" x1="0" x2="1">
            <stop offset="0%" stopColor="#eef3ff" />
            <stop offset="100%" stopColor="#f7fbff" />
          </linearGradient>
        </defs>
        <path
          d="M0,32 C120,64 240,64 360,48 C480,32 600,0 720,8 C840,16 960,64 1080,64 C1200,64 1320,32 1440,16 L1440,160 L0,160 Z"
          fill="url(#waWave)"
          opacity="0.8"
        />
      </svg>
    </div>
  );
}


