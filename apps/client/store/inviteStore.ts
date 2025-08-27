import { create } from "zustand";

export interface IncomingInvite {
  inviteId: string;
  fromUserId: string;
  message?: string | null;
  createdAt: number;
}

interface InviteState {
  invites: IncomingInvite[];
  addOrReplace: (inv: Omit<IncomingInvite, "createdAt">) => void;
  remove: (inviteId: string) => void;
  setInvites: (list: Array<Omit<IncomingInvite, "createdAt">>) => void;
  clear: () => void;
}

export const useInviteStore = create<InviteState>((set, get) => ({
  invites: [],
  addOrReplace: (inv) => {
    const list = get().invites.slice();
    const idx = list.findIndex((i) => i.inviteId === inv.inviteId);
    const item: IncomingInvite = { ...inv, createdAt: Date.now() };
    if (idx >= 0) list[idx] = item; else list.unshift(item);
    set({ invites: list });
  },
  remove: (inviteId) => {
    set({ invites: get().invites.filter((i) => i.inviteId !== inviteId) });
  },
  setInvites: (list) => {
    const items = list.map((i) => ({ ...i, createdAt: Date.now() }));
    set({ invites: items });
  },
  clear: () => {
    set({ invites: [] });
  },
}));


