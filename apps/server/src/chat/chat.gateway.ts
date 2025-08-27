import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";

import { ChatService } from "./chat.service";

@Injectable()
@WebSocketGateway({
  cors: {
    origin:
      process.env.NEXT_PUBLIC_CLIENT_URL ||
      process.env.FRONTEND_URL ||
      "http://localhost:3000",
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  public server!: Server;

  private userIdToSocketIds = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const tokenFromAuth =
        (client.handshake.auth?.token as string) || undefined;
      const cookieHeader = client.handshake.headers.cookie || "";
      const tokenFromCookie = parseCookie(cookieHeader)["accessToken"];
      const token = tokenFromAuth || tokenFromCookie;
      if (!token) throw new Error("No token");

      const payload = this.jwtService.verify(token) as { sub: string };
      const userId = payload.sub;
      (client as Socket & { data: { userId?: string } }).data.userId = userId;

      // 사용자가 속한 방에 조인시키기 위해 현재 참여중인 룸을 조회
      // 간단화를 위해 클라이언트가 join 이벤트로 원하는 방에 들어오게 함

      const set = this.userIdToSocketIds.get(userId) ?? new Set<string>();
      set.add(client.id);
      this.userIdToSocketIds.set(userId, set);

      this.registerRoomHandlers(client);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const userId: string | undefined = (
      client as Socket & { data: { userId?: string } }
    ).data.userId;
    if (!userId) return;
    const set = this.userIdToSocketIds.get(userId);
    if (!set) return;
    set.delete(client.id);
    if (set.size === 0) this.userIdToSocketIds.delete(userId);
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    const set = this.userIdToSocketIds.get(userId);
    if (!set) return;
    for (const socketId of set) this.server.to(socketId).emit(event, payload);
  }

  registerRoomHandlers(client: Socket): void {
    client.on("room:join", async (p: { roomId: string }) => {
      if (!p?.roomId) return;
      const userId: string | undefined = (
        client as Socket & { data: { userId?: string } }
      ).data.userId;
      if (!userId) return;
      try {
        const ok = await this.chatService.isParticipant(userId, p.roomId);
        if (ok) client.join(p.roomId);
      } catch (e) {
        console.error(e);
      }
    });
    client.on("room:leave", (p: { roomId: string }) => {
      if (!p?.roomId) return;
      client.leave(p.roomId);
    });
  }
}

function parseCookie(cookie: string): Record<string, string> {
  const result: Record<string, string> = {};
  cookie
    .split(";")
    .map((v) => v.trim())
    .filter(Boolean)
    .forEach((part) => {
      const idx = part.indexOf("=");
      if (idx > 0) {
        const k = decodeURIComponent(part.slice(0, idx));
        const val = decodeURIComponent(part.slice(idx + 1));
        result[k] = val;
      }
    });
  return result;
}
