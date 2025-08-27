"use client";

import { useEffect, useRef, useState } from "react";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { chatApi, userApi } from "@/lib/api";
import { connectSocket, getSocket } from "@/lib/socket";
   import { useAuthStore } from "@/store/authStore";
import { useChatUnreadStore } from "@/store/chatUnreadStore";
import styles from "@/styles/Chat.module.css";
import type { ChatMessageItem, ChatRoomListItem } from "@/types/chat.types";

export default function ChatRoomPage({
  params,
}: {
  params: { roomId: string };
}) {
  const { roomId } = params;
  const { ready } = useRequireAuth();
  const userId = useAuthStore((s) => s.user?.id);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [counterpartName, setCounterpartName] = useState<string>("상대방");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const resetUnread = useChatUnreadStore((s) => s.reset);
  const setLastSeen = useChatUnreadStore((s) => s.setLastSeen);
  const setUnread = useChatUnreadStore((s) => s.setCount);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const res = await chatApi.listRoomMessages(roomId, 50);
      if (res.data) setMessages(res.data);
    })();

    // 상대 닉네임 로드 (참가자에서 우선 시도)
    (async () => {
      const roomsRes = await chatApi.listMyRooms();
      const room = (roomsRes.data?.rooms as ChatRoomListItem[] | undefined)?.find(
        (r) => r.roomId === roomId
      );
      if (room?.counterpartUsername)
        setCounterpartName(room.counterpartUsername);
    })();

    const s = connectSocket() || getSocket();
    if (!s || !roomId) return;
    const join = () => s.emit("room:join", { roomId });
    join();
    (async () => {
      try {
        await chatApi.markRoomRead(roomId);
        const resp = await chatApi.getUnreadCount(roomId);
        if (resp.data) setUnread(roomId, resp.data.count);
      } catch (e) {
        console.error(e);
      }
    })();
    const onNew = (p: {
      roomId: string;
      type?: "chat" | "system";
      message: {
        id: string;
        content: string;
        senderId: string;
        createdAt: string;
      };
    }) => {
      if (p.roomId !== roomId) return;
      setMessages((prev) => [...prev, p.message]);
    };
    s.on("chat:new", onNew);
    s.on("connect", join);
    return () => {
      s.off("chat:new", onNew);
      s.off("connect", join);
      s.emit("room:leave", { roomId });
      try {
        setLastSeen(roomId);
        resetUnread(roomId);
      } catch {
        // ignore
      }
    };
  }, [roomId, ready]);

  useEffect(() => {
    if (!userId) return;
    if (counterpartName !== "상대방") return;
    const otherId = messages.find((m) => m.senderId !== userId)?.senderId;
    if (!otherId) return;
    (async () => {
      try {
        const resp = await userApi.getUsersPublic([otherId]);
        const name = resp.data?.[0]?.username;
        if (name) setCounterpartName(name);
      } catch {
        // ignore
      }
    })();
  }, [messages, userId, counterpartName]);

  if (!ready) return null;
  return (
    <div className={styles.roomContainer}>
      <div className={styles.messages}>
        <div className={styles.topActionsRow}>
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className={styles.sendBtn}
          >
            채팅방 나가기
          </button>
        </div>
        {messages.map((m) => {
          const isMe = m.senderId === userId;
          const name = isMe ? "나" : counterpartName;
          const time = new Date(m.createdAt).toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
          const isSystem = m.content.includes("님이 채팅방에서 나갔습니다");
          if (isSystem) {
            return (
              <div key={m.id} className={styles.systemRow}>
                <div className={styles.systemText}>{m.content}</div>
              </div>
            );
          }
          return (
            <div
              key={m.id}
              className={`${styles.messageRow} ${
                isMe ? styles.right : styles.left
              }`}
            >
              <div className={styles.name}>{name}</div>
              <div className={styles.line}>
                {isMe ? (
                  <>
                    <span className={styles.time}>{time}</span>
                    <div className={`${styles.bubble} ${styles.bubbleMy}`}>
                      {m.content}
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`${styles.bubble} ${styles.bubbleOther}`}>
                      {m.content}
                    </div>
                    <span className={styles.time}>{time}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const content = inputRef.current?.value?.trim();
          if (!content) return;
          chatApi.postRoomMessage(roomId, content).catch(() => {});
          if (inputRef.current) inputRef.current.value = "";
        }}
        className={styles.inputBar}
      >
        <input
          ref={inputRef}
          placeholder="메시지를 입력하세요..."
          className={styles.input}
        />
        <button type="submit" className={styles.sendBtn}>
          전송
        </button>
      </form>
      {showLeaveConfirm ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div style={{ fontWeight: 700 }}>채팅방 나가기</div>
            <div>이 채팅방에서 나가시겠어요?</div>
            <div className={styles.modalBtnRow}>
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className={styles.modalBtn}
              >
                취소
              </button>
              <button
                onClick={async () => {
                  try {
                    const s = getSocket();
                    if (s) s.emit("room:leave", { roomId });
                  } catch (e) {
                    console.error(e);
                  }
                  const res = await chatApi.leaveRoom(roomId);
                  if (res.data?.ok) {
                    window.location.href = "/chat";
                  } else {
                    alert("나가기에 실패했어요. 잠시 후 다시 시도해주세요.");
                    setShowLeaveConfirm(false);
                  }
                }}
                className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
