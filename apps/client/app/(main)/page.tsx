"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AcceptNoticeBanner from "@/components/features/AcceptNoticeBanner";
import PendingInviteBanner from "@/components/features/PendingInviteBanner";
import RejectNoticeBanner from "@/components/features/RejectNoticeBanner";
import Brand from "@/components/layout/Brand";
import { chatApi, userApi } from "@/lib/api";
import { connectSocket, getSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import { useInviteStore } from "@/store/inviteStore";
import { useNoticeStore } from "@/store/noticeStore";
import styles from "@/styles/Home.module.css";
import { useChatUnreadStore } from "@/store/chatUnreadStore";

type RecentRoom = {
  roomId: string;
  counterpartUsername?: string | null;
  lastMessage?: string | null;
};
type NearbyUserLite = {
  id: string;
  username: string | null;
  distance?: string;
};

export default function MainPage() {
  const router = useRouter();
  const { isLoggedIn, hasInitialized, initialize } = useAuthStore();
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);
  const [_nearbyUsers, _setNearbyUsers] = useState<NearbyUserLite[]>([]);
  const unreadMap = useChatUnreadStore((s) => s.perRoom);
  const acceptCount = useNoticeStore(
    (s) => s.notices.filter((n) => n.type === "invite-accepted").length
  );
  const rejectCount = useNoticeStore(
    (s) => s.notices.filter((n) => n.type === "invite-rejected").length
  );
  const pendingCount = useInviteStore((s) => s.invites.length);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoggedIn) return;

    let detach: (() => void) | undefined;

    const loadAndWire = async () => {
      // 1) 최근 채팅 방 목록 로드
      const rooms = await chatApi.listMyRooms();
      const list = (rooms.data?.rooms ?? []) as Array<{
        roomId: string;
        counterpartUsername?: string | null;
        lastMessage?: { content: string } | null;
      }>;
      setRecentRooms(
        list.slice(0, 3).map((r) => ({
          roomId: r.roomId,
          counterpartUsername: r.counterpartUsername ?? null,
          lastMessage: r.lastMessage?.content ?? null,
        }))
      );

      // 2) 소켓 연결 및 이벤트 구독 (실시간 반영)
      const s = getSocket() ?? connectSocket();
      if (!s) return;

      const roomIds = list.map((r) => r.roomId);
      const joinAll = () => roomIds.forEach((id) => s.emit("room:join", { roomId: id }));
      joinAll();
      const onConnect = () => joinAll();
      s.on("connect", onConnect);

      const onChatNew = (p: { roomId: string; type: string; message?: unknown }) => {
        if (!p?.roomId) return;
        const content = typeof (p as any).message === "string"
          ? (p as any).message
          : (p as any).message?.content ?? null;
        setRecentRooms((prev) => {
          const idx = prev.findIndex((r) => r.roomId === p.roomId);
          if (idx >= 0) {
            const updated = { ...prev[idx], lastMessage: content ?? prev[idx].lastMessage };
            const reordered = [updated, ...prev.filter((_, i) => i !== idx)];
            return reordered.slice(0, 3);
          }
          const added = [{ roomId: p.roomId, counterpartUsername: null, lastMessage: content ?? null }, ...prev];
          return added.slice(0, 3);
        });
      };
      s.on("chat:new", onChatNew);

      const onInviteUpdate = (payload: { status?: string; roomId?: string }) => {
        if (payload?.status === "accepted" && payload.roomId) {
          // 새로 생성된 방 반영 및 조인
          (async () => {
            const rooms2 = await chatApi.listMyRooms();
            const list2 = (rooms2.data?.rooms ?? []) as Array<{
              roomId: string;
              counterpartUsername?: string | null;
              lastMessage?: { content: string } | null;
            }>;
            setRecentRooms(
              list2.slice(0, 3).map((r) => ({
                roomId: r.roomId,
                counterpartUsername: r.counterpartUsername ?? null,
                lastMessage: r.lastMessage?.content ?? null,
              }))
            );
            s.emit("room:join", { roomId: payload.roomId });
          })();
        }
      };
      s.on("invite:update", onInviteUpdate);

      detach = () => {
        s.off("connect", onConnect);
        s.off("chat:new", onChatNew);
        s.off("invite:update", onInviteUpdate);
      };
    };

    loadAndWire().catch(console.error);

    return () => {
      if (detach) detach();
    };
  }, [isLoggedIn]);

  if (!hasInitialized) return null;
  return (
    <div className={styles.container}>
      <Brand />
      <div className={styles.hero}>
        <div className={styles.title}>안녕하세요 👋</div>
        <div className={styles.subtitle}>
          근처의 새로운 사람들을 만나보세요.
        </div>
      </div>

      {isLoggedIn ? (
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={() => router.push("/map")}
          >
            🗺️ 지도 보기
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => router.push("/matches")}
          >
            🤝 매칭 보기
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => router.push("/chat")}
          >
            💬 채팅
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => router.push("/profile")}
          >
            👤 내 프로필
          </button>
        </div>
      ) : null}

      {isLoggedIn ? (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>최근 채팅</div>
          <div className={styles.sectionBody}>
            {recentRooms.length ? (
              <div className={styles.list}>
                {recentRooms.map((r) => (
                  <div
                    key={r.roomId}
                    className={styles.itemRow}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      router.push(`/chat/${encodeURIComponent(r.roomId)}`)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/chat/${encodeURIComponent(r.roomId)}`);
                      }
                    }}
                    aria-label={`채팅방 열기: ${
                      r.counterpartUsername ?? "대화상대"
                    }`}
                  >
                    <div style={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {r.counterpartUsername ?? "대화상대"}
                        </div>
                        <div style={{ color: "#6b7280", fontSize: 13 }}>
                          {r.lastMessage ?? "메시지가 없습니다"}
                        </div>
                      </div>
                      {Number(unreadMap?.[r.roomId] ?? 0) > 0 && (
                        <span
                          aria-label="미확인 메시지 개수"
                          style={{
                            background: "#ef4444",
                            color: "#fff",
                            borderRadius: 999,
                            padding: "2px 8px",
                            fontSize: 12,
                            fontWeight: 700,
                            minWidth: 20,
                            textAlign: "center",
                          }}
                        >
                          {unreadMap[r.roomId]}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>아직 최근 채팅이 없어요</div>
            )}
          </div>
        </div>
      ) : null}

      {isLoggedIn && rejectCount > 0 && <RejectNoticeBanner />}
      {isLoggedIn && acceptCount > 0 && <AcceptNoticeBanner />}
      {isLoggedIn && pendingCount > 0 && <PendingInviteBanner />}
    </div>
  );
}
