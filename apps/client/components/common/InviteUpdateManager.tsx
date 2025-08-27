"use client";

import { useEffect } from "react";

import { connectSocket, getSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import { useNoticeStore } from "@/store/noticeStore";

interface InviteUpdatePayload {
  inviteId: string;
  status: "accepted" | "rejected";
  roomId?: string;
  counterpartUserId?: string;
}

export default function InviteUpdateManager() {
  const addNotice = useNoticeStore((s) => s.add);
  const currentUserId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    let socket = getSocket();
    if (!socket) {
      socket = connectSocket() || null;
    }

    let cleanup: (() => void) | undefined;

    const attach = () => {
      const s = getSocket();
      if (!s) return;
      const onUpdate = (p: InviteUpdatePayload) => {
        // 상대방이 거절/수락한 경우 알림 생성
        if (p.counterpartUserId) {
          if (p.status === "rejected") {
            addNotice(
              {
                id: p.inviteId,
                type: "invite-rejected",
                userId: p.counterpartUserId,
              },
              currentUserId
            );
          } else if (p.status === "accepted") {
            addNotice(
              {
                id: p.inviteId,
                type: "invite-accepted",
                userId: p.counterpartUserId,
              },
              currentUserId
            );
          }
        }
      };
      s.on("invite:update", onUpdate);
      cleanup = () => s.off("invite:update", onUpdate);
    };

    if (socket) {
      if (socket.connected) {
        attach();
      } else {
        socket.once("connect", attach);
      }
    } else {
      const timer = setInterval(() => {
        const s = getSocket();
        if (s) {
          clearInterval(timer);
          if (s.connected) attach();
          else s.once("connect", attach);
        }
      }, 500);
      cleanup = () => clearInterval(timer as unknown as number);
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [addNotice]);

  return null;
}
