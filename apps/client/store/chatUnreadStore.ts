import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ChatRoomLite {
  roomId: string;
  lastMessage?: { createdAt: string } | null;
}

interface ChatUnreadState {
  perRoom: Record<string, number>;
  lastSeen: Record<string, string>;
  bump: (roomId: string, n?: number) => void;
  reset: (roomId: string) => void;
  setCount: (roomId: string, count: number) => void;
  setLastSeen: (roomId: string, iso?: string) => void;
  syncFromRooms: (rooms: ChatRoomLite[]) => void;
}

export const useChatUnreadStore = create<ChatUnreadState>()(
  persist(
    (set, get) => ({
      perRoom: {},
      lastSeen: {},
      bump: (roomId, n = 1) => {
        const cur = get().perRoom[roomId] ?? 0;
        set({ perRoom: { ...get().perRoom, [roomId]: cur + n } });
      },
      reset: (roomId) => {
        const map = { ...get().perRoom };
        if (map[roomId]) delete map[roomId];
        set({ perRoom: map });
      },
      setCount: (roomId, count) => {
        const map = { ...get().perRoom };
        if (count <= 0) {
          if (map[roomId]) delete map[roomId];
        } else {
          map[roomId] = count;
        }
        set({ perRoom: map });
      },
      setLastSeen: (roomId, iso) => {
        const when = iso ?? new Date().toISOString();
        set({ lastSeen: { ...get().lastSeen, [roomId]: when } });
      },
      syncFromRooms: (rooms) => {
        const lastSeen = get().lastSeen;
        const perRoom: Record<string, number> = { ...get().perRoom };
        for (const r of rooms) {
          const last = r.lastMessage?.createdAt;
          const seen = lastSeen[r.roomId];
          if (last && (!seen || new Date(last) > new Date(seen))) {
            perRoom[r.roomId] = Math.max(1, perRoom[r.roomId] ?? 0);
          }
        }
        set({ perRoom });
      },
    }),
    { name: "chat-unread-store" }
  )
);
