"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let isConnecting = false;

export function connectSocket(): Socket | null {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("accessToken") ?? undefined
      : undefined;
  if (!token) return null;
  if (socket) return socket;
  if (isConnecting) return socket;

  isConnecting = true;
  socket = io(baseUrl, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    auth: { token },
  });
  socket.once("connect", () => {
    isConnecting = false;
  });
  socket.once("connect_error", () => {
    isConnecting = false;
  });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    try {
      socket.disconnect();
    } finally {
      socket = null;
      isConnecting = false;
    }
  }
}
