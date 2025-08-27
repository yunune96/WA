"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { chatApi } from "@/lib/api";
import { useChatUnreadStore } from "@/store/chatUnreadStore";
import styles from "@/styles/Chat.module.css";
import type { ChatRoomListItem } from "@/types/chat.types";

export default function ChatListPage() {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const [rooms, setRooms] = useState<ChatRoomListItem[]>([]);
  const perRoom = useChatUnreadStore((s) => s.perRoom);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const res = await chatApi.listMyRooms();
      const data = (res.data?.rooms ?? []) as ChatRoomListItem[];
      setRooms(data);
    })();
  }, [ready]);

  if (!ready) return null;
  return (
    <div className={styles.chatListWrapper}>
      <h1 className={styles.chatListTitle}>내 채팅방</h1>
      <div className={styles.chatListGrid}>
        {rooms.map((r) => (
          <div
            key={r.roomId}
            className={styles.chatCard}
            onClick={() => router.push(`/chat/${encodeURIComponent(r.roomId)}`)}
            role="button"
          >
            <div className={styles.cardHeaderRow}>
              <div className={styles.chatCardName}>
                {r.counterpartUsername ?? "대화상대"}
              </div>
            </div>
            {perRoom[r.roomId] ? (
              <span
                className={`${styles.unreadBadge} ${styles.unreadBadgeAbs}`}
              >
                {perRoom[r.roomId]}
              </span>
            ) : null}
            <div className={styles.chatCardLast}>
              {r.lastMessage?.content ?? "메시지가 없습니다"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
