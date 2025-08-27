import { create } from "zustand";

import { ACCESS_TOKEN_COOKIE } from "@/constants/cookies";
import {
  ACCESS_TOKEN_KEY,
  IGNORE_PIN_ONCE_KEY,
  RECENT_MATCHED_USER_IDS_KEY,
} from "@/constants/storage";
import { DEFAULT_NEARBY_RADIUS } from "@/constants/time";
import { authApi, userApi } from "@/lib/api";
import { useInviteStore } from "@/store/inviteStore";
import { useNearbyStore } from "@/store/nearbyStore";
import type { LoginResponse, LoginResult } from "@/types/auth.types";

interface AuthState {
  isLoggedIn: boolean;
  user: LoginResponse["user"] | null;
  hasInitialized: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoggedIn: false,
  user: null,
  hasInitialized: false,

  login: async (email, password): Promise<LoginResult> => {
    const result = await authApi.login(email, password);

    if (result.error) {
      return { success: false, error: result.error };
    }

    if (result.data) {
      const { accessToken, user } = result.data;
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      try {
        const secureAttr =
          typeof window !== "undefined" && window.location.protocol === "https:"
            ? "; Secure"
            : "";
        document.cookie = `${ACCESS_TOKEN_COOKIE}=${accessToken}; Path=/; SameSite=Lax${secureAttr}`;
      } catch (e) {
        console.error(e);
      }
      set({ isLoggedIn: true, user: user, hasInitialized: true });
      try {
        await new Promise<void>((resolve) => {
          if (typeof window === "undefined" || !navigator.geolocation) {
            resolve();
            return;
          }
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              try {
                await userApi.updateLocation(
                  pos.coords.latitude,
                  pos.coords.longitude
                );
              } finally {
                resolve();
              }
            },
            () => resolve(),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        });
        await useNearbyStore.getState().fetchNearbyOnce(DEFAULT_NEARBY_RADIUS);
      } catch (e) {
        console.error(e);
      }
      return { success: true, user: user };
    }

    return { success: false, error: "알 수 없는 응답입니다." };
  },

  logout: () => {
    try {
      useInviteStore.getState().clear();
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem("user");
    try {
      localStorage.removeItem(RECENT_MATCHED_USER_IDS_KEY);
      localStorage.setItem(IGNORE_PIN_ONCE_KEY, "1");
    } catch (e) {
      console.error(e);
    }
    try {
      document.cookie = `${ACCESS_TOKEN_COOKIE}=; Max-Age=0; Path=/`;
    } catch (e) {
      console.error(e);
    }
    set({ isLoggedIn: false, user: null, hasInitialized: true });
  },

  initialize: () => {
    if (get().hasInitialized) {
      return;
    }
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem(ACCESS_TOKEN_KEY)
        : null;
    if (!token) {
      set({ hasInitialized: true });
      return;
    }
    (async () => {
      const res = await authApi.verifyToken();
      if (res.data) {
        const user = {
          ...res.data,
          needsOnboarding: false,
        } as LoginResponse["user"];
        set({ isLoggedIn: true, user, hasInitialized: true });
        try {
          const tokenNow =
            typeof window !== "undefined"
              ? localStorage.getItem(ACCESS_TOKEN_KEY)
              : null;
          if (tokenNow) {
            const secureAttr =
              typeof window !== "undefined" &&
              window.location.protocol === "https:"
                ? "; Secure"
                : "";
            document.cookie = `${ACCESS_TOKEN_COOKIE}=${tokenNow}; Path=/; SameSite=Lax${secureAttr}`;
          }
        } catch (e) {
          console.error(e);
        }
        try {
          await new Promise<void>((resolve) => {
            if (typeof window === "undefined" || !navigator.geolocation) {
              resolve();
              return;
            }
            navigator.geolocation.getCurrentPosition(
              async (pos) => {
                try {
                  await userApi.updateLocation(
                    pos.coords.latitude,
                    pos.coords.longitude
                  );
                } finally {
                  resolve();
                }
              },
              () => resolve(),
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
          });
          await useNearbyStore
            .getState()
            .fetchNearbyOnce(DEFAULT_NEARBY_RADIUS);
        } catch (e) {
          console.error(e);
        }
      } else {
        try {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          document.cookie = `${ACCESS_TOKEN_COOKIE}=; Max-Age=0; Path=/`;
        } catch (e) {
          console.error(e);
        }
        set({ isLoggedIn: false, user: null, hasInitialized: true });
      }
    })();
  },
}));
