"use client";

import { useEffect, useMemo, useState } from "react";

import { userApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useNearbyStore } from "@/store/nearbyStore";
import { useNoticeStore } from "@/store/noticeStore";
import styles from "@/styles/PendingInviteBanner.module.css";
import type { MatchedUser } from "@/types/user.types";

export default function AcceptNoticeBanner() {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { notices, dismissForUser } = useNoticeStore();
  const acceptNotices = useMemo(
    () => notices.filter((n) => n.type === "invite-accepted"),
    [notices]
  );
  const [userMap, setUserMap] = useState<Record<string, MatchedUser>>({});

  const nearbyById = useNearbyStore((s) => s.byId);
  const hasNearby = useNearbyStore((s) => s.hasFetched);
  useEffect(() => {
    if (!acceptNotices.length) {
      setUserMap({});
      return;
    }
    const map: Record<string, MatchedUser> = {};
    for (const id of Object.keys(nearbyById)) map[id] = nearbyById[id];

    const missingIds = acceptNotices
      .map((n) => n.userId)
      .filter((id) => !map[id]);
    let cancelled = false;
    (async () => {
      if (missingIds.length > 0) {
        const res = await userApi.getUsersPublic(missingIds);
        if (cancelled) return;
        for (const u of res.data ?? []) {
          map[u.id] = {
            id: u.id,
            email: u.email,
            username: u.username,
            hobbies: u.hobbies,
            commonHobbies: u.commonHobbies,
            distance: undefined as unknown as number,
            latitude: u.latitude,
            longitude: u.longitude,
          } as unknown as MatchedUser;
        }
      }
      setUserMap(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [acceptNotices, nearbyById, hasNearby]);

  if (!acceptNotices.length) return null;

  return (
    <>
      {acceptNotices.map((n) => {
        const user = userMap[n.userId];
        return (
          <div
            key={n.id}
            className={styles.inviteCard}
            style={{
              background: "#ecfeff",
              borderColor: "#a5f3fc",
              boxShadow: "0 6px 20px rgba(14,165,233,0.08)",
            }}
          >
            <div className={styles.title} style={{ color: "#075985" }}>
              ✅ 상대방이 매칭 요청을 수락했어요
            </div>
            <div className={styles.content} style={{ color: "#0c4a6e" }}>
              <div>
                상대방 : <b>{user?.username || "익명"}</b>
              </div>
            </div>
            <div className={styles.actions}>
              <button
                onClick={() => dismissForUser(n.id, currentUserId)}
                className={styles.button}
                style={{
                  background: "linear-gradient(180deg,#22d3ee 0%,#06b6d4 100%)",
                }}
              >
                닫기
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
}
