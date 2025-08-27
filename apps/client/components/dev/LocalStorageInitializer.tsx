"use client";

import { useEffect } from "react";

export default function LocalStorageInitializer() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      if (!sessionStorage.getItem("dev_session_started")) {
        console.log(
          "🛠️ Dev Mode: New tab session started. Preserving auth cookie."
        );
        // 의도치 않은 세션 종료 방지를 위해 localStorage 전체 삭제는 중단
        sessionStorage.setItem("dev_session_started", "true");
      }
    }
  }, []);

  return null;
}
