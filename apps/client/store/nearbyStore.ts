import { create } from "zustand";

import { userApi } from "@/lib/api";
import type { MatchedUser } from "@/types/user.types";

interface NearbyState {
  byId: Record<string, MatchedUser>;
  lastFetchedAt?: number;
  hasFetched: boolean;
  fetchNearbyOnce: (radius?: number) => Promise<void>;
  refreshNearby: (radius?: number) => Promise<void>;
  clear: () => void;
}

export const useNearbyStore = create<NearbyState>((set, get) => ({
  byId: {},
  hasFetched: false,

  fetchNearbyOnce: async (radius = 5001) => {
    if (get().hasFetched) return;
    const res = await userApi.findNearby(radius);
    const map: Record<string, MatchedUser> = {};
    for (const u of res.data ?? []) map[u.id] = u;
    set({ byId: map, lastFetchedAt: Date.now(), hasFetched: true });
  },

  refreshNearby: async (radius = 5001) => {
    const res = await userApi.findNearby(radius);
    const map: Record<string, MatchedUser> = {};
    for (const u of res.data ?? []) map[u.id] = u;
    set({ byId: map, lastFetchedAt: Date.now(), hasFetched: true });
  },

  clear: () => set({ byId: {}, lastFetchedAt: undefined, hasFetched: false }),
}));


