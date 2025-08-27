export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    username: string | null;
    needsOnboarding: boolean;
  };
}

export type LoginResult =
  | { success: true; user: LoginResponse["user"] }
  | { success: false; error: string };

export interface RegisterResponse {
  id: string;
  email: string;
  username: string | null;
  createdAt: Date;
  updatedAt: Date;
}
