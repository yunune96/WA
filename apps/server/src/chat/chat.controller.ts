import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

import { User } from "../auth/decorators/user.decorator";
import { UserWithoutPassword } from "../shared/types/user.types";

import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";

@Controller("chat")
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly gateway: ChatGateway
  ) {}

  @Post("/invites")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.CREATED)
  async createInvite(
    @User() me: UserWithoutPassword,
    @Body() body: { toUserId: string; message?: string }
  ) {
    const invite = await this.chatService.createInvite(
      me.id,
      body.toUserId,
      body.message
    );
    this.gateway.emitToUser(body.toUserId, "invite:new", {
      inviteId: invite.id,
      fromUserId: me.id,
      message: invite.message ?? null,
    });
    return { inviteId: invite.id };
  }

  @Post("/invites/:inviteId/accept")
  @HttpCode(HttpStatus.OK)
  async acceptInvite(@Param("inviteId") inviteId: string) {
    const room = await this.chatService.acceptInvite(inviteId);
    if (!room) return { error: "invalid_invite" };
    const inv = await this.chatService.getInvite(inviteId);
    if (inv) {
      this.gateway.emitToUser(inv.requesterId, "invite:update", {
        inviteId,
        status: "accepted",
        roomId: room.roomId,
        counterpartUserId: inv.receiverId,
      });
    }
    return room;
  }

  @Post("/invites/:inviteId/reject")
  @HttpCode(HttpStatus.OK)
  async rejectInvite(@Param("inviteId") inviteId: string) {
    const ok = await this.chatService.rejectInvite(inviteId);
    const inv = await this.chatService.getInvite(inviteId);
    if (ok && inv) {
      this.gateway.emitToUser(inv.requesterId, "invite:update", {
        inviteId,
        status: "rejected",
        counterpartUserId: inv.receiverId,
      });
    }
    return { ok };
  }

  @Post("/invites/:inviteId/cancel")
  @HttpCode(HttpStatus.OK)
  async cancelInvite(@Param("inviteId") inviteId: string) {
    const ok = await this.chatService.cancelInvite(inviteId);
    return { ok };
  }

  @Post("/invites/received/pending")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  async listReceivedPending(@User() me: UserWithoutPassword): Promise<{
    invites: Array<{
      id: string;
      fromUserId: string;
      toUserId: string;
      message?: string;
    }>;
  }> {
    const list = await this.chatService.listReceivedPending(me.id);
    const shaped = list.map((i) => ({
      id: i.id,
      fromUserId: i.requesterId,
      toUserId: i.receiverId,
      message:
        (i as unknown as { message?: string | null }).message ?? undefined,
    }));
    return { invites: shaped };
  }

  @Post("/invites/sent/pending")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  async listSentPending(@User() me: UserWithoutPassword): Promise<{
    invites: Array<{
      id: string;
      fromUserId: string;
      toUserId: string;
      message?: string;
    }>;
  }> {
    const list = await this.chatService.listSentPending(me.id);
    const shaped = list.map((i) => ({
      id: i.id,
      fromUserId: i.requesterId,
      toUserId: i.receiverId,
      message:
        (i as unknown as { message?: string | null }).message ?? undefined,
    }));
    return { invites: shaped };
  }

  @Post("/invites/sent/rejected")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  async listSentRejected(@User() me: UserWithoutPassword): Promise<{
    invites: Array<{
      id: string;
      toUserId: string;
      handledAt?: string;
    }>;
  }> {
    const list = await this.chatService.listSentRejected(me.id);
    const shaped = list.map(
      (i: { id: string; receiverId: string; updatedAt: Date }) => ({
        id: i.id,
        toUserId: i.receiverId,
        handledAt: i.updatedAt
          ? new Date(i.updatedAt).toISOString()
          : undefined,
      })
    );
    return { invites: shaped };
  }

  @Post("/invites/sent/accepted")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  async listSentAccepted(@User() me: UserWithoutPassword): Promise<{
    invites: Array<{
      id: string;
      toUserId: string;
      handledAt?: string;
    }>;
  }> {
    const list = await this.chatService.listSentAccepted(me.id);
    const shaped = list.map(
      (i: { id: string; receiverId: string; updatedAt: Date }) => ({
        id: i.id,
        toUserId: i.receiverId,
        handledAt: i.updatedAt
          ? new Date(i.updatedAt).toISOString()
          : undefined,
      })
    );
    return { invites: shaped };
  }

  @Post("/rooms/my")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  async myRooms(@User() me: UserWithoutPassword) {
    const list = await this.chatService.listMyRooms(me.id);
    return { rooms: list };
  }

  @Post("/rooms/:roomId/unread-count")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  async getUnreadCount(
    @User() me: UserWithoutPassword,
    @Param("roomId") roomId: string
  ) {
    const count = await this.chatService.getUnreadCount(me.id, roomId);
    return { roomId, count };
  }

  @Post("/rooms/unread-counts")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  async getUnreadCounts(@User() me: UserWithoutPassword) {
    const counts = await this.chatService.getUnreadCountsForUser(me.id);
    return { counts };
  }

  @Post("/rooms/:roomId/read")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  async markRead(
    @User() me: UserWithoutPassword,
    @Param("roomId") roomId: string
  ) {
    const res = await this.chatService.markRoomRead(me.id, roomId);
    return res;
  }

  @Post("/rooms/:roomId/messages")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.CREATED)
  async postMessage(
    @User() me: UserWithoutPassword,
    @Param("roomId") roomId: string,
    @Body() body: { content: string }
  ) {
    const msg = await this.chatService.createMessage(
      me.id,
      roomId,
      body.content
    );
    if (!msg) return { error: "forbidden" };
    this.gateway.server.to(roomId).emit("chat:new", {
      roomId,
      type: "chat",
      message: msg,
    });
    // 수신자들에게 최신 unread-count 푸시
    const participantIds = await this.chatService.getRoomParticipantIds(roomId);
    const recipients = participantIds.filter((id) => id !== me.id);
    for (const uid of recipients) {
      const count = await this.chatService.getUnreadCount(uid, roomId);
      this.gateway.emitToUser(uid, "chat:unread", { roomId, count });
    }
    return { ok: true, message: msg };
  }

  @Post("/rooms/:roomId/messages/list")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  async listMessages(
    @User() me: UserWithoutPassword,
    @Param("roomId") roomId: string,
    @Body() body: { cursor?: string; take?: number }
  ) {
    const rows = await this.chatService.getRoomMessages(
      me.id,
      roomId,
      body?.take ?? 50,
      body?.cursor
    );
    return { messages: rows };
  }

  @Post("/rooms/:roomId/leave")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  async leaveRoom(
    @User() me: UserWithoutPassword,
    @Param("roomId") roomId: string
  ) {
    const res = await this.chatService.leaveRoom(me.id, roomId);
    if (res.ok) {
      if (res.recipients?.length) {
        for (const uid of res.recipients) {
          this.gateway.emitToUser(uid, "chat:new", {
            roomId,
            type: "system",
            message: res.message,
          });
        }
      } else {
        this.gateway.server.to(roomId).emit("chat:new", {
          roomId,
          type: "system",
          message: res.message,
        });
      }
    }
    return res;
  }
}
