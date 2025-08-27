"use client";
// useSocketEvent
// socket.io 클라이언트의 특정 이벤트를 구독/해제하는 공통 훅입니다.
// - 마운트 시 s.on(event, handler)
// - 언마운트 시 s.off(event, handler)
// - getSocket()이 null이면 아무 것도 하지 않음
import { useEffect } from "react";

import { getSocket } from "@/lib/socket";

export function useSocketEvent<T = unknown>(
  event: string,
  handler: (data: T) => void
) {
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    s.on(event, handler);
    return () => {
      s.off(event, handler);
    };
  }, [event, handler]);
}
