"use client";

import { useEffect } from "react";

import { chatApi } from "@/lib/api";
import { connectSocket, getSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import { useInviteStore } from "@/store/inviteStore";

interface IncomingInvitePayload {
  inviteId: string;
  fromUserId: string;
  message?: string | null;
}

export default function IncomingInviteManager() {
  const { isLoggedIn, hasInitialized } = useAuthStore();
  const { addOrReplace } = useInviteStore();

  useEffect(() => {
    let socket = getSocket();
    if (!socket) socket = connectSocket() || null;

    let cleanup: (() => void) | undefined;
    const attach = () => {
      const s = getSocket();
      if (!s) return;
      const onNew = (p: IncomingInvitePayload) => {
        addOrReplace({
          inviteId: p.inviteId,
          fromUserId: p.fromUserId,
          message: p.message ?? null,
        });
      };
      s.on("invite:new", onNew);
      cleanup = () => s.off("invite:new", onNew);
    };

    if (socket) {
      if (socket.connected) attach();
      else socket.once("connect", attach);
    } else {
      const timer = setInterval(() => {
        const s = getSocket();
        if (s) {
          clearInterval(timer);
          if (s.connected) attach();
          else s.once("connect", attach);
        }
      }, 300);
      cleanup = () => clearInterval(timer as unknown as number);
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [addOrReplace]);

  useEffect(() => {
    if (!hasInitialized || !isLoggedIn) return;
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    if (!token) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let backoffMs = 1500;
    const maxBackoff = 8000;
    let cancelled = false;

    const schedule = (ms = 3000) => {
      if (cancelled || !isLoggedIn) return;
      timer = setTimeout(tick, ms);
    };

    const tick = async () => {
      if (cancelled || !isLoggedIn) return;
      const s = getSocket();
      if (s && s.connected) return;

      const tokenNow =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null;
      if (!tokenNow) return;

      try {
        const res = await chatApi.listReceivedPending();
        const list = res.data?.invites ?? [];
        if (list.length > 0) {
          for (const it of list) {
            addOrReplace({
              inviteId: it.id,
              fromUserId: it.fromUserId,
              message: it.message ?? null,
            });
          }
        }
        backoffMs = 1500;
        schedule();
      } catch (e) {
        if (cancelled || !isLoggedIn) return;
        backoffMs = Math.min(backoffMs * 2, maxBackoff);
        schedule(backoffMs);
      }
    };

    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [isLoggedIn, hasInitialized, addOrReplace]);

  return null;
}
