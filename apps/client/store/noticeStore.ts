import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NoticeType = "invite-rejected" | "invite-accepted";

export interface NoticeItem {
  id: string;
  type: NoticeType;
  userId: string;
  createdAt: number;
}

interface NoticeState {
  notices: NoticeItem[];
  add: (
    n: Omit<NoticeItem, "createdAt">,
    currentUserId: string | undefined
  ) => void;
  remove: (id: string) => void;
  dismissForUser: (id: string, currentUserId: string | undefined) => void;
  clear: () => void;
  dismissedByUserId: Record<string, Record<string, true>>;
}

export const useNoticeStore = create<NoticeState>()(
  persist(
    (set, get) => ({
      notices: [],
      dismissedByUserId: {},
      add: (n, currentUserId) => {
        if (currentUserId) {
          const dismissed = get().dismissedByUserId[currentUserId];
          if (dismissed && dismissed[n.id]) return;
        }
        const exists = get().notices.some((x) => x.id === n.id);
        if (exists) return;
        const item: NoticeItem = { ...n, createdAt: Date.now() };
        set({ notices: [item, ...get().notices] });
      },
      remove: (id) =>
        set({ notices: get().notices.filter((v) => v.id !== id) }),
      dismissForUser: (id, currentUserId) => {
        set({ notices: get().notices.filter((v) => v.id !== id) });
        if (!currentUserId) return;
        const map = { ...get().dismissedByUserId };
        const inner = { ...(map[currentUserId] || {}) };
        inner[id] = true;
        map[currentUserId] = inner;
        set({ dismissedByUserId: map });
      },
      clear: () => set({ notices: [] }),
    }),
    { name: "notice-store" }
  )
);
