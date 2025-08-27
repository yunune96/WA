"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import ConfirmModal from "@/components/ui/ConfirmModal";
import { chatApi, userApi } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import { useInviteStore } from "@/store/inviteStore";
import { useNearbyStore } from "@/store/nearbyStore";
import styles from "@/styles/PendingInviteBanner.module.css";
import type { MatchedUser } from "@/types/user.types";

export default function PendingInviteBanner() {
  const [inviterMap, setInviterMap] = useState<Record<string, MatchedUser>>({});
  const [confirm, setConfirm] = useState<{
    type: "accept" | "reject";
    inviteId: string;
    fromUserId: string;
  } | null>(null);
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const { invites, addOrReplace, remove } = useInviteStore();

  const socketConnected = useMemo(() => !!getSocket(), []);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (socketConnected) return;
    let cancelled = false;
    (async () => {
      if (!isLoggedIn || cancelled) return;
      const res = await chatApi.listReceivedPending();
      if (cancelled) return;
      const first = res.data?.invites?.[0];
      if (first) {
        addOrReplace({
          inviteId: first.id,
          fromUserId: first.fromUserId,
          message: first.message,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [socketConnected, isLoggedIn, addOrReplace]);

  const nearbyById = useNearbyStore((s) => s.byId);
  const hasNearby = useNearbyStore((s) => s.hasFetched);
  useEffect(() => {
    if (!invites.length) {
      setInviterMap({});
      return;
    }
    const map: Record<string, MatchedUser> = {};
    for (const id of Object.keys(nearbyById)) map[id] = nearbyById[id];

    const missingIds = invites
      .map((v) => v.fromUserId)
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
            distance: undefined as unknown as number, // 거리 미표시
            latitude: u.latitude,
            longitude: u.longitude,
          } as unknown as MatchedUser;
        }
      }
      setInviterMap(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [invites, nearbyById, hasNearby]);

  if (!invites.length) return null;

  return (
    <>
      {invites.map((inv) => {
        const user = inviterMap[inv.fromUserId];
        return (
          <div key={inv.inviteId} className={styles.inviteCard}>
            <div className={styles.title}>📧채팅 요청이 도착했어요!</div>
            <div className={styles.content}>
              <div>
                보낸 사람 : <b>{user?.username || "익명"}</b>
                {typeof user?.distance !== "undefined" && (
                  <span> · 거리 {user.distance}m</span>
                )}
              </div>
              {user?.commonHobbies?.length ? (
                <div>🔍 : {user.commonHobbies.join(", ")}</div>
              ) : null}
              {inv.message ? (
                <div className={styles.messageBox}>{inv.message}</div>
              ) : null}
            </div>
            <div className={styles.actions}>
              <button
                onClick={() =>
                  setConfirm({
                    type: "reject",
                    inviteId: inv.inviteId,
                    fromUserId: inv.fromUserId,
                  })
                }
                className={`${styles.button} ${styles.reject}`}
              >
                거절
              </button>
              <button
                onClick={() =>
                  setConfirm({
                    type: "accept",
                    inviteId: inv.inviteId,
                    fromUserId: inv.fromUserId,
                  })
                }
                className={`${styles.button} ${styles.accept}`}
              >
                수락
              </button>
            </div>
          </div>
        );
      })}

      {confirm && (
        <ConfirmModal
          open={!!confirm}
          title={confirm.type === "accept" ? "요청 수락" : "요청 거절"}
          description={
            <p>
              {(() => {
                const u = inviterMap[confirm.fromUserId];
                const name = u?.username || "익명";
                return confirm.type === "accept"
                  ? `${name}님의 채팅 요청을 수락하시겠습니까?`
                  : `${name}님의 채팅 요청을 거절하시겠습니까?`;
              })()}
            </p>
          }
          footer={
            <>
              <button onClick={() => setConfirm(null)}>닫기</button>
              <button
                onClick={async () => {
                  try {
                    if (confirm.type === "accept") {
                      await chatApi.acceptInvite(confirm.inviteId);
                      remove(confirm.inviteId);
                      router.push(`/chat`);
                    } else {
                      await chatApi.rejectInvite(confirm.inviteId);
                      remove(confirm.inviteId);
                    }
                  } finally {
                    setConfirm(null);
                  }
                }}
              >
                확인
              </button>
            </>
          }
        />
      )}
    </>
  );
}
