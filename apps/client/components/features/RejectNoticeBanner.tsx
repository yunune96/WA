"use client";

import { useEffect, useMemo, useState } from "react";

import { userApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useNearbyStore } from "@/store/nearbyStore";
import { useNoticeStore } from "@/store/noticeStore";
import styles from "@/styles/PendingInviteBanner.module.css";
import type { MatchedUser } from "@/types/user.types";

export default function RejectNoticeBanner() {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { notices, dismissForUser } = useNoticeStore();
  const rejectNotices = useMemo(
    () => notices.filter((n) => n.type === "invite-rejected"),
    [notices]
  );
  const [userMap, setUserMap] = useState<Record<string, MatchedUser>>({});

  const nearbyById = useNearbyStore((s) => s.byId);
  const hasNearby = useNearbyStore((s) => s.hasFetched);
  useEffect(() => {
    if (!rejectNotices.length) {
      setUserMap({});
      return;
    }
    const map: Record<string, MatchedUser> = {};
    for (const id of Object.keys(nearbyById)) map[id] = nearbyById[id];

    const missingIds = rejectNotices
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
  }, [rejectNotices, nearbyById, hasNearby]);

  if (!rejectNotices.length) return null;

  return (
    <>
      {rejectNotices.map((n) => {
        const user = userMap[n.userId];
        return (
          <div
            key={n.id}
            className={styles.inviteCard}
            style={{
              background: "#fef2f2",
              borderColor: "#fecaca",
              boxShadow: "0 6px 20px rgba(220,38,38,0.08)",
            }}
          >
            <div className={styles.title} style={{ color: "#991b1b" }}>
              ❌ 상대방이 매칭 요청을 거절했어요
            </div>
            <div className={styles.content} style={{ color: "#7f1d1d" }}>
              <div>
                상대방 : <b>{user?.username || "익명"}</b>
                {typeof user?.distance !== "undefined" && (
                  <span> · 거리 {user.distance}m</span>
                )}
              </div>
            </div>
            <div className={styles.actions}>
              <button
                onClick={() => dismissForUser(n.id, currentUserId)}
                className={styles.button}
                style={{
                  background: "linear-gradient(180deg,#ef4444 0%,#dc2626 100%)",
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
