"use client";

import { useSearchParams, useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useEffect as useEffectReact,
} from "react";

import ConfirmModal from "@/components/ui/ConfirmModal";
import { userApi, chatApi } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import { useInviteStore } from "@/store/inviteStore";
import { useNoticeStore } from "@/store/noticeStore";
import styles from "@/styles/Matches.module.css";
import type { MatchedUser } from "@/types/user.types";

const RADIUS_OPTIONS = [
  { label: "All", value: 5001 },
  { label: "500m", value: 501 },
  { label: "1km", value: 1001 },
  { label: "3km", value: 3001 },
];

interface MatchesViewProps {
  initialUsers: MatchedUser[];
}

export default function MatchesView({ initialUsers }: MatchesViewProps) {
  const router = useRouter();
  const [rawUsers, setRawUsers] = useState<MatchedUser[]>(initialUsers);
  const { add: addNotice } = useNoticeStore();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const invites = useInviteStore((s) => s.invites);
  const [existingChatUserIds, setExistingChatUserIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteTarget, setInviteTarget] = useState<MatchedUser | null>(null);
  const [pendingInvites, setPendingInvites] = useState<
    Record<string, string | undefined>
  >({});
  // 거절 또는 사용자가 취소하여 "고정 우선순위"를 해제해야 하는 사용자 집합
  const [demotedUserIds, setDemotedUserIds] = useState<Record<string, boolean>>(
    {}
  );
  const [cancelTarget, setCancelTarget] = useState<MatchedUser | null>(null);
  const inviteMessageRef = useRef<HTMLTextAreaElement | null>(null);
  const searchParams = useSearchParams();
  const pinnedUserId = useMemo(() => searchParams.get("pin"), [searchParams]);
  const initialRadiusFromQuery = useMemo(() => {
    const r = Number(searchParams.get("radius"));
    if (!Number.isFinite(r)) return 5001;
    const allowed = [501, 1001, 3001, 5001];
    return allowed.includes(r) ? r : 5001;
  }, [searchParams]);
  const [selectedRadius, setSelectedRadius] = useState<number>(
    initialRadiusFromQuery
  );

  const toNum = (d: unknown) =>
    typeof d === "number" ? d : Number(d as string);

  const sortUsersByPinnedPendingDistance = (
    list: MatchedUser[],
    pendingOverride?: Record<string, string | undefined>,
    pinnedOverride?: string | null
  ) => {
    const pending = pendingOverride ?? pendingInvites;

    let effectivePinned: string | null = null;
    try {
      const flag =
        typeof window !== "undefined"
          ? localStorage.getItem("ignorePinOnce")
          : null;
      if (flag === "1") {
        localStorage.removeItem("ignorePinOnce");
        effectivePinned = null;
      } else {
        effectivePinned =
          (typeof pinnedOverride === "undefined"
            ? pinnedUserId
            : pinnedOverride) ?? null;
      }
    } catch {
      effectivePinned =
        (typeof pinnedOverride === "undefined"
          ? pinnedUserId
          : pinnedOverride) ?? null;
    }

    const rank = (u: MatchedUser) => {
      // 맵에서 선택된 사용자라도 거절/취소된 경우에는 고정 우선순위를 해제하여 거리순으로 정렬
      if (
        effectivePinned &&
        u.id === effectivePinned &&
        !demotedUserIds[effectivePinned]
      ) {
        return 0;
      }
      if (pending && pending[u.id]) return 1;
      return 2;
    };

    const sorted = [...list].sort((a, b) => {
      const ra = rank(a);
      const rb = rank(b);
      if (ra !== rb) return ra - rb;
      return toNum(a.distance) - toNum(b.distance);
    });
    return sorted;
  };

  const fetchNearbyUsers = (radius: number) => {
    setIsLoading(true);
    setError(null);
    setRawUsers([]);

    userApi
      .findNearby(radius)
      .then((result) => {
        if (result.data) {
          const list = result.data;
          setRawUsers(list);
        } else {
          setError(result.error || "사용자를 불러오는 데 실패했습니다.");
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleRadiusChange = (radius: number) => {
    setSelectedRadius(radius);
    fetchNearbyUsers(radius);
  };

  useEffect(() => {
    // 이미 채팅방이 개설된 상대는 /matches에서 숨기기 위해 사전 로딩
    (async () => {
      try {
        const res = await chatApi.listMyRooms();
        const ids = new Set<string>();
        for (const r of res.data?.rooms ?? []) {
          if (r.counterpartUserId) ids.add(r.counterpartUserId);
        }
        setExistingChatUserIds(ids);
      } catch {
        // ignore
      }
    })();
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        userApi
          .updateLocation(latitude, longitude)
          .then(() => fetchNearbyUsers(initialRadiusFromQuery))
          .catch(() => fetchNearbyUsers(initialRadiusFromQuery));
      },
      () => {
        fetchNearbyUsers(initialRadiusFromQuery);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [initialRadiusFromQuery]);

  useEffectReact(() => {
    const s = getSocket();
    if (!s) return;
    const onUpdate = (p: {
      inviteId: string;
      status: "accepted" | "rejected";
      roomId?: string;
      counterpartUserId?: string;
    }) => {
      const entry = Object.entries(pendingInvites).find(
        ([, id]) => id === p.inviteId
      );
      const userId = p.counterpartUserId || (entry ? entry[0] : undefined);
      if (!userId) return;
      if (p.status === "accepted" && p.roomId) {
        router.push(`/chat?roomId=${encodeURIComponent(p.roomId)}`);
      }
      if (p.status === "rejected") {
        // 거절 시: 메인 배너 알림 + 고정 우선순위 해제
        addNotice(
          { id: p.inviteId, type: "invite-rejected", userId },
          currentUserId
        );
        setDemotedUserIds((prev) => ({ ...prev, [userId]: true }));
      }
      setPendingInvites((prev) => ({ ...prev, [userId]: undefined }));
    };
    s.on("invite:update", onUpdate);
    return () => {
      s.off("invite:update", onUpdate);
    };
  }, [pendingInvites, router]);

  useEffect(() => {
    (async () => {
      try {
        const res = await chatApi.listSentPending();
        if (res.data?.invites?.length) {
          const map: Record<string, string> = {};
          for (const inv of res.data.invites) {
            if (inv.toUserId) map[inv.toUserId] = inv.id;
          }
          setPendingInvites(map);
        } else {
          setPendingInvites({});
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const users = useMemo(() => {
    // 1) 기본 정렬
    const sorted = sortUsersByPinnedPendingDistance(rawUsers);
    // 2) 메인 세션에서 수락/거절되지 않은 '받은 초대 대기자'는 /matches에서 숨김
    const hiddenSet = new Set(invites.map((i) => i.fromUserId));
    // 3) 이미 채팅방이 개설된 상대도 숨김
    return sorted.filter((u) => !hiddenSet.has(u.id) && !existingChatUserIds.has(u.id));
  }, [rawUsers, pendingInvites, pinnedUserId, invites, existingChatUserIds]);

  const content = (
    <div className={styles.container}>
      <h1 className={styles.title}>🔍Matching</h1>

      <div className={styles.radiusSelector}>
        {RADIUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => handleRadiusChange(option.value)}
            className={`${styles.radiusButton} ${
              selectedRadius === option.value ? styles.activeRadius : ""
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className={styles.centered}>🔍 주변 사용자를 찾고 있습니다...</div>
      )}
      {!isLoading && error && <div className={styles.centered}>{error}</div>}
      {!isLoading &&
        !error &&
        (users.length > 0 ? (
          <div className={styles.userList}>
            {users.map((user) => (
              <div key={user.id} className={styles.userCard}>
                <div className={styles.cardHeader}>
                  <span className={styles.username}>
                    {user.username || "익명"}
                  </span>
                  <span className={styles.distance}>{user.distance}m</span>
                </div>
                <p className={styles.commonHobbies}>
                  <strong>🔍</strong> {user.commonHobbies.join(", ")}
                </p>
                <div className={styles.actions}>
                  {pendingInvites[user.id] ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className={styles.dangerBtn}
                        onClick={() => setCancelTarget(user)}
                      >
                        <span>🚫</span>
                        <span>취소</span>
                      </button>
                      <button className={styles.ctaBtn} disabled>
                        <span>⏳</span>
                        <span>수락 대기중</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      className={styles.ctaBtn}
                      onClick={() => setInviteTarget(user)}
                    >
                      <span>🤝</span>
                      <span>함께하기</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.centered}>
            데이터를 불러오고 있습니다 잠시만 기다려주세요... 😥
          </p>
        ))}
    </div>
  );

  return (
    <>
      {content}
      {inviteTarget && (
        <ConfirmModal
          open={!!inviteTarget}
          title={inviteTarget?.username ?? "채팅 요청"}
          description={
            <div style={{ display: "grid", gap: 10 }}>
              <p style={{ marginBottom: 4 }}>
                {inviteTarget.username ?? "익명"}님에게 채팅 요청을 보낼까요?
              </p>
              <textarea
                ref={inviteMessageRef}
                defaultValue={""}
                placeholder="전달할 메시지를 입력하세요 (선택)"
                rows={3}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  resize: "vertical",
                }}
              />
            </div>
          }
          footer={
            <>
              <button onClick={() => setInviteTarget(null)}>취소</button>
              <button
                onClick={async () => {
                  const targetId = inviteTarget.id;
                  setInviteTarget(null);
                  const message = inviteMessageRef.current?.value?.trim();
                  const res = await chatApi.createInvite(
                    targetId,
                    message ? message : undefined
                  );
                  if (!res.error && res.data?.inviteId) {
                    setPendingInvites((prev) => ({
                      ...prev,
                      [targetId]: res.data!.inviteId,
                    }));
                    if (inviteMessageRef.current) {
                      inviteMessageRef.current.value = "";
                    }
                    try {
                      const key = "recentMatchedUserIds";
                      const current: string[] = JSON.parse(
                        localStorage.getItem(key) || "[]"
                      );
                      const next = [
                        targetId,
                        ...current.filter((v) => v !== targetId),
                      ].slice(0, 50);
                      localStorage.setItem(key, JSON.stringify(next));
                    } catch (e) {
                      console.log("err");
                    }
                    // 정렬은 pendingInvites 변경에 따라 자동으로 반영됩니다.
                  }
                }}
              >
                보내기
              </button>
            </>
          }
        />
      )}
      {cancelTarget && (
        <ConfirmModal
          open={!!cancelTarget}
          title="요청 취소"
          description={<p>매칭 요청을 취소하시겠습니까?</p>}
          footer={
            <>
              <button onClick={() => setCancelTarget(null)}>닫기</button>
              <button
                onClick={async () => {
                  const inviteId = pendingInvites[cancelTarget.id];
                  setCancelTarget(null);
                  if (inviteId) {
                    await chatApi.cancelInvite(inviteId);
                  }
                  setPendingInvites((prev) => ({
                    ...prev,
                    [cancelTarget.id]: undefined,
                  }));
                  // 사용자가 직접 취소한 경우에도 고정 우선순위 해제
                  setDemotedUserIds((prev) => ({
                    ...prev,
                    [cancelTarget.id]: true,
                  }));
                }}
              >
                취소하기
              </button>
            </>
          }
        />
      )}
    </>
  );
}
