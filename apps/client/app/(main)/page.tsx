"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AcceptNoticeBanner from "@/components/features/AcceptNoticeBanner";
import PendingInviteBanner from "@/components/features/PendingInviteBanner";
import RejectNoticeBanner from "@/components/features/RejectNoticeBanner";
import Brand from "@/components/layout/Brand";
import { chatApi, userApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useInviteStore } from "@/store/inviteStore";
import { useNoticeStore } from "@/store/noticeStore";
import styles from "@/styles/Home.module.css";

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
    (async () => {
      try {
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
      } catch (e) {
        console.error(e);
      }
      try {
        const me = await userApi.getMe();
        if (!me.data) return;
        const idsResp = await userApi.getUsersPublic([me.data.id]);
        const myself = idsResp.data?.[0];
        if (myself && myself.commonHobbies) {
          // 주변 사용자는 MatchesView에서 다루지만, 홈에서는 가볍게 최근 3명만
        }
      } catch (e) {
        console.error(e);
      }
    })();
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
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {r.counterpartUsername ?? "대화상대"}
                      </div>
                      <div style={{ color: "#6b7280", fontSize: 13 }}>
                        {r.lastMessage ?? "메시지가 없습니다"}
                      </div>
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
