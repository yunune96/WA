import type { ApiResponse } from "@/types/api.types";
import type { LoginResponse } from "@/types/auth.types";
import type { ChatMessageItem, ChatRoomListItem } from "@/types/chat.types";
import type { Hobby } from "@/types/hobby.types";
import type { UserWithoutPassword, MatchedUser } from "@/types/user.types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  public requestApi<T>(endpoint: string, options: RequestInit = {}) {
    return this.request<T>(endpoint, options);
  }

  findNearbyUsers(radius: number): Promise<ApiResponse<MatchedUser[]>> {
    return this.request<MatchedUser[]>(
      `/api/locations/nearby-users?radius=${radius}`
    );
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const isAbsolute =
      endpoint.startsWith("http://") || endpoint.startsWith("https://");
    const url = isAbsolute ? endpoint : `${this.baseURL}${endpoint}`;

    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const accessToken =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    if (accessToken) {
      defaultHeaders["Authorization"] = `Bearer ${accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: "include",
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
      };
    }
  }

  login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  signupRequest(
    email: string,
    password: string,
    username: string
  ): Promise<ApiResponse<{ ok: boolean }>> {
    return this.request("/api/auth/signup-request", {
      method: "POST",
      body: JSON.stringify({ email, password, username }),
    });
  }

  verifyToken(): Promise<ApiResponse<UserWithoutPassword>> {
    return this.request<UserWithoutPassword>("/api/auth/verify");
  }

  updateUserLocation(
    latitude: number,
    longitude: number
  ): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>("/api/users/me/location", {
      method: "PATCH",
      body: JSON.stringify({ latitude, longitude }),
    });
  }

  selectUserHobbies(
    userId: string,
    hobbyIds: number[]
  ): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(`/api/users/${userId}/hobbies`, {
      method: "POST",
      body: JSON.stringify({ hobbyIds }),
    });
  }

  getAllHobbies(): Promise<ApiResponse<Hobby[]>> {
    return this.request<Hobby[]>("/api/hobbies");
  }

  getMyProfile(): Promise<
    ApiResponse<{ id: string; email: string; username: string | null }>
  > {
    return this.request("/api/users/me");
  }

  updateMyUsername(
    username: string
  ): Promise<
    ApiResponse<{ id: string; email: string; username: string | null }>
  > {
    return this.request("/api/users/me/username", {
      method: "PATCH",
      body: JSON.stringify({ username }),
    });
  }

  updateMyPassword(
    oldPassword: string,
    newPassword: string
  ): Promise<ApiResponse<{ success: boolean; error?: string }>> {
    return this.request("/api/users/me/password", {
      method: "PATCH",
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  }

  createChatInvite(
    toUserId: string,
    message?: string
  ): Promise<ApiResponse<{ inviteId: string }>> {
    return this.request<{ inviteId: string }>("/api/chat/invites", {
      method: "POST",
      body: JSON.stringify({ toUserId, message }),
    });
  }

  async listRoomMessages(
    roomId: string,
    take = 50,
    cursor?: string
  ): Promise<ApiResponse<ChatMessageItem[]>> {
    const resp = await this.request<{
      messages: ChatMessageItem[];
    }>(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages/list`, {
      method: "POST",
      body: JSON.stringify({ take, cursor }),
    });
    return { data: resp.data?.messages, error: resp.error };
  }

  postRoomMessage(
    roomId: string,
    content: string
  ): Promise<
    ApiResponse<{
      ok: boolean;
      message?: {
        id: string;
        content: string;
        senderId: string;
        createdAt: string;
      };
    }>
  > {
    return this.request(
      `/api/chat/rooms/${encodeURIComponent(roomId)}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      }
    );
  }

  getUnreadCount(
    roomId: string
  ): Promise<ApiResponse<{ roomId: string; count: number }>> {
    return this.request(
      `/api/chat/rooms/${encodeURIComponent(roomId)}/unread-count`,
      {
        method: "POST",
      }
    );
  }

  getUnreadCounts(): Promise<ApiResponse<{ counts: Record<string, number> }>> {
    return this.request(`/api/chat/rooms/unread-counts`, { method: "POST" });
  }

  markRoomRead(
    roomId: string
  ): Promise<ApiResponse<{ ok: boolean; lastReadAt?: string }>> {
    return this.request(`/api/chat/rooms/${encodeURIComponent(roomId)}/read`, {
      method: "POST",
    });
  }

  leaveRoom(roomId: string): Promise<ApiResponse<{ ok: boolean }>> {
    return this.request(`/api/chat/rooms/${encodeURIComponent(roomId)}/leave`, {
      method: "POST",
    });
  }

  getUsersPublic(ids: string[]): Promise<
    ApiResponse<
      Array<{
        id: string;
        email: string;
        username: string | null;
        hobbies: string[];
        commonHobbies: string[];
        latitude: number | null;
        longitude: number | null;
      }>
    >
  > {
    return this.request("/api/users/public", {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

export const authApi = {
  login: apiClient.login.bind(apiClient),
  verifyToken: apiClient.verifyToken.bind(apiClient),
  signupResend: (email: string) =>
    apiClient.requestApi<{ ok: boolean }>("/api/auth/signup/resend", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  signupRequest: apiClient.signupRequest.bind(apiClient),
};

export const userApi = {
  updateLocation: apiClient.updateUserLocation.bind(apiClient),
  selectHobbies: apiClient.selectUserHobbies.bind(apiClient),
  findNearby: apiClient.findNearbyUsers.bind(apiClient),
  getUsersPublic: apiClient.getUsersPublic.bind(apiClient),
  getMe: apiClient.getMyProfile.bind(apiClient),
  updateMyUsername: apiClient.updateMyUsername.bind(apiClient),
  updateMyPassword: apiClient.updateMyPassword.bind(apiClient),
};

export const hobbyApi = {
  getAll: apiClient.getAllHobbies.bind(apiClient),
};

export const chatApi = {
  createInvite: apiClient.createChatInvite.bind(apiClient),
  listRoomMessages: apiClient.listRoomMessages.bind(apiClient),
  postRoomMessage: apiClient.postRoomMessage.bind(apiClient),
  getUnreadCount: apiClient.getUnreadCount.bind(apiClient),
  getUnreadCounts: apiClient.getUnreadCounts.bind(apiClient),
  markRoomRead: apiClient.markRoomRead.bind(apiClient),
  leaveRoom: apiClient.leaveRoom.bind(apiClient),
  cancelInvite: (inviteId: string) =>
    apiClient["request"].call(
      apiClient,
      `/api/chat/invites/${inviteId}/cancel`,
      {
        method: "POST",
      }
    ) as Promise<ApiResponse<{ ok: boolean }>>,
  acceptInvite: (inviteId: string) =>
    apiClient["request"].call(
      apiClient,
      `/api/chat/invites/${inviteId}/accept`,
      {
        method: "POST",
      }
    ) as Promise<ApiResponse<{ roomId?: string }>>,
  rejectInvite: (inviteId: string) =>
    apiClient["request"].call(
      apiClient,
      `/api/chat/invites/${inviteId}/reject`,
      {
        method: "POST",
      }
    ) as Promise<ApiResponse<{ ok: boolean }>>,
  listReceivedPending: () =>
    apiClient["request"].call(apiClient, `/api/chat/invites/received/pending`, {
      method: "POST",
    }) as Promise<
      ApiResponse<{
        invites: Array<{ id: string; fromUserId: string; message?: string }>;
      }>
    >,
  listSentPending: () =>
    apiClient["request"].call(apiClient, `/api/chat/invites/sent/pending`, {
      method: "POST",
    }) as Promise<
      ApiResponse<{
        invites: Array<{
          id: string;
          fromUserId: string;
          toUserId: string;
          message?: string;
        }>;
      }>
    >,
  listSentRejected: () =>
    apiClient["request"].call(apiClient, `/api/chat/invites/sent/rejected`, {
      method: "POST",
    }) as Promise<
      ApiResponse<{
        invites: Array<{ id: string; toUserId: string; handledAt?: string }>;
      }>
    >,
  listSentAccepted: () =>
    apiClient["request"].call(apiClient, `/api/chat/invites/sent/accepted`, {
      method: "POST",
    }) as Promise<
      ApiResponse<{
        invites: Array<{ id: string; toUserId: string; handledAt?: string }>;
      }>
    >,
  listMyRooms: () =>
    apiClient["request"].call(apiClient, `/api/chat/rooms/my`, {
      method: "POST",
    }) as Promise<
      ApiResponse<{
        rooms: ChatRoomListItem[];
      }>
    >,
};

// Payments & Coins API
export const paymentsApi = {
  checkout: (coins: number, provider: "toss" | "kakao") =>
    apiClient["request"].call(apiClient, `/api/payments/checkout`, {
      method: "POST",
      body: JSON.stringify({ coins, provider }),
    }) as Promise<
      ApiResponse<{
        provider: "toss" | "kakao";
        orderId: string;
        amountKrw: number;
        payload: any;
      }>
    >,
  tossConfirm: (
    paymentKey: string,
    orderId: string,
    amount: number
  ) =>
    apiClient["request"].call(apiClient, `/api/payments/toss/confirm`, {
      method: "POST",
      body: JSON.stringify({ paymentKey, orderId, amount }),
    }) as Promise<ApiResponse<{ ok: boolean }>>,
};

export const coinsApi = {
  getBalance: () =>
    apiClient["request"].call(apiClient, `/api/coins/balance`) as Promise<
      ApiResponse<{ balance: number }>
    >,
  getTransactions: () =>
    apiClient["request"].call(apiClient, `/api/coins/transactions`) as Promise<
      ApiResponse<
        Array<{
          id: string;
          change: number;
          reason: string;
          createdAt: string;
        }>
      >
    >,
  spend: (coins: number, reason?: string) =>
    apiClient["request"].call(apiClient, `/api/coins/spend`, {
      method: "POST",
      body: JSON.stringify({ coins, reason }),
    }) as Promise<ApiResponse<{ balance: number }>>,
};
