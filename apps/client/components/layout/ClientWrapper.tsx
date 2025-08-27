"use client";

import { useEffect } from "react";

import GlobalAlertManager from "@/components/common/GlobalAlertManager";
import IncomingInviteManager from "@/components/common/IncomingInviteManager";
import InviteUpdateManager from "@/components/common/InviteUpdateManager";
import LocalStorageInitializer from "@/components/dev/LocalStorageInitializer";
import { chatApi } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import { useChatUnreadStore } from "@/store/chatUnreadStore";
import { useInviteStore } from "@/store/inviteStore";
import { useNoticeStore } from "@/store/noticeStore";

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn, hasInitialized, initialize } = useAuthStore();
  const clearInvites = useInviteStore((s) => s.clear);
  const addNotice = useNoticeStore((s) => s.add);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const setUnread = useChatUnreadStore((s) => s.setCount);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isLoggedIn) {
      const s = connectSocket();
      // 전역 소켓 수신으로 미확인 카운트 갱신
      if (s) {
        const onUnread = (p: { roomId: string; count: number }) => {
          if (!p?.roomId) return;
          setUnread(p.roomId, p.count);
        };
        s.on("chat:unread", onUnread);
        return () => {
          s.off("chat:unread", onUnread);
        };
      }
    } else {
      disconnectSocket();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    let done = false;
    (async () => {
      if (!isLoggedIn || done) return;
      try {
        // 초기 로그인 시 서버 기준 unread-count 동기화
        const countsResp = await chatApi.getUnreadCounts();
        const counts = countsResp.data?.counts ?? {};
        Object.entries(counts).forEach(([roomId, count]) => setUnread(roomId, count));
        const [rej, acc] = await Promise.all([
          chatApi.listSentRejected(),
          chatApi.listSentAccepted(),
        ]);
        for (const it of rej.data?.invites ?? [])
          addNotice(
            { id: it.id, type: "invite-rejected", userId: it.toUserId },
            currentUserId
          );
        for (const it of acc.data?.invites ?? [])
          addNotice(
            { id: it.id, type: "invite-accepted", userId: it.toUserId },
            currentUserId
          );
      } catch (e) {
        // ignore
      } finally {
        done = true;
      }
    })();
  }, [isLoggedIn, addNotice]);

  useEffect(() => {
    if (!isLoggedIn) {
      try {
        clearInvites();
      } catch (e) {
        console.error(e);
      }
      try {
        useNoticeStore.getState().clear();
      } catch (e) {
        console.error(e);
      }
    }
  }, [isLoggedIn, clearInvites, useNoticeStore]);
  return (
    <>
      {/* 초기 상태 확정 전에는 렌더를 지연하여 로그인/로그아웃 버튼 깜빡임 방지 */}
      {hasInitialized ? (
        <>
          <GlobalAlertManager />
          <IncomingInviteManager />
          <InviteUpdateManager />
          <LocalStorageInitializer />
          {children}
        </>
      ) : (
        <div />
      )}
    </>
  );
}
