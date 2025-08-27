import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../core/database/prisma.service";

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async createInvite(
    fromUserId: string,
    toUserId: string,
    message?: string
  ): Promise<{ id: string; message?: string }> {
    const exists = await this.prisma.connection_Request.findFirst({
      where: {
        requesterId: fromUserId,
        receiverId: toUserId,
        status: "pending",
      },
      select: { id: true },
    });
    if (exists) return { id: exists.id };

    const invite = await this.prisma.connection_Request.create({
      data: {
        requesterId: fromUserId,
        receiverId: toUserId,
        status: "pending",
        message: message ?? undefined,
      },
      select: { id: true, message: true },
    });
    return { id: invite.id, message: invite.message ?? message };
  }

  async getInvite(inviteId: string) {
    return await this.prisma.connection_Request.findUnique({
      where: { id: inviteId },
    });
  }

  async acceptInvite(inviteId: string): Promise<{ roomId: string } | null> {
    return await this.prisma.$transaction(async (tx) => {
      const inv = await tx.connection_Request.findUnique({
        where: { id: inviteId },
      });
      if (!inv || inv.status !== "pending") return null;
      const updated = await tx.connection_Request.updateMany({
        where: { id: inviteId, status: "pending" },
        data: { status: "accepted" },
      });
      if (updated.count === 0) return null;

      const room = await tx.chat_Room.create({
        data: {},
        select: { id: true },
      });
      await tx.chat_Room_Participant.create({
        data: { roomId: room.id, userId: inv.requesterId },
      });
      await tx.chat_Room_Participant.create({
        data: { roomId: room.id, userId: inv.receiverId },
      });
      return { roomId: room.id };
    });
  }

  async rejectInvite(inviteId: string): Promise<boolean> {
    const res = await this.prisma.connection_Request.updateMany({
      where: { id: inviteId, status: "pending" },
      data: { status: "rejected" },
    });
    return res.count > 0;
  }

  async cancelInvite(inviteId: string, byUserId?: string): Promise<boolean> {
    const where: Prisma.Connection_RequestWhereInput = {
      id: inviteId,
      status: "pending",
      ...(byUserId ? { requesterId: byUserId } : {}),
    };

    const res = await this.prisma.connection_Request.updateMany({
      where,
      data: { status: "cancelled" },
    });
    return res.count > 0;
  }

  async listReceivedPending(userId: string) {
    return await this.prisma.connection_Request.findMany({
      where: { receiverId: userId, status: "pending" },
      orderBy: { createdAt: "desc" },
    });
  }

  async listSentPending(userId: string) {
    return await this.prisma.connection_Request.findMany({
      where: { requesterId: userId, status: "pending" },
      orderBy: { createdAt: "desc" },
    });
  }

  async listSentRejected(userId: string, limit = 20) {
    return await this.prisma.connection_Request.findMany({
      where: { requesterId: userId, status: "rejected" },
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: {
        id: true,
        requesterId: true,
        receiverId: true,
        updatedAt: true,
      },
    });
  }

  async listSentAccepted(userId: string, limit = 20) {
    return await this.prisma.connection_Request.findMany({
      where: { requesterId: userId, status: "accepted" },
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: {
        id: true,
        requesterId: true,
        receiverId: true,
        updatedAt: true,
      },
    });
  }

  async isParticipant(userId: string, roomId: string): Promise<boolean> {
    const p = await this.prisma.chat_Room_Participant.findUnique({
      where: { userId_roomId: { userId, roomId } },
      select: { userId: true },
    });
    return !!p;
  }

  async getRoomMessages(
    userId: string,
    roomId: string,
    take = 50,
    cursor?: string
  ): Promise<
    Array<{ id: string; content: string; senderId: string; createdAt: Date }>
  > {
    const isMember = await this.isParticipant(userId, roomId);
    if (!isMember) return [];

    const where = { roomId } as const;
    const orderBy = { createdAt: "desc" } as const;
    const args: Prisma.MessageFindManyArgs = {
      where,
      orderBy,
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: { id: true, content: true, senderId: true, createdAt: true },
    };
    const rows = await this.prisma.message.findMany(args);
    return rows.reverse();
  }

  async createMessage(
    userId: string,
    roomId: string,
    content: string
  ): Promise<{
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
  } | null> {
    const isMember = await this.isParticipant(userId, roomId);
    if (!isMember) return null;
    const msg = await this.prisma.message.create({
      data: { content, roomId, senderId: userId },
      select: { id: true, content: true, senderId: true, createdAt: true },
    });
    return msg;
  }

  async leaveRoom(
    userId: string,
    roomId: string
  ): Promise<
    | {
        ok: true;
        message: {
          id: string;
          content: string;
          senderId: string;
          createdAt: Date;
        };
        recipients: string[];
      }
    | { ok: false }
  > {
    const participant = await this.prisma.chat_Room_Participant.findUnique({
      where: { userId_roomId: { userId, roomId } },
      select: { userId: true },
    });
    if (!participant) return { ok: false };

    const result = await this.prisma.$transaction(async (tx) => {
      const beforeParts = await tx.chat_Room_Participant.findMany({
        where: { roomId },
        select: { userId: true },
      });
      const recipients = beforeParts
        .map((p) => p.userId)
        .filter((id) => id !== userId);
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { username: true },
      });
      const displayName = user?.username?.trim() || "사용자";
      const content = `-------${displayName} 님이 채팅방에서 나갔습니다-------`;

      const msg = await tx.message.create({
        data: { content, roomId, senderId: userId },
        select: { id: true, content: true, senderId: true, createdAt: true },
      });

      await tx.chat_Room_Participant.delete({
        where: { userId_roomId: { userId, roomId } },
      });

      const leftCount = await tx.chat_Room_Participant.count({
        where: { roomId },
      });
      if (leftCount === 0) {
        await tx.chat_Room.delete({ where: { id: roomId } });
      }

      return { msg, recipients };
    });

    return { ok: true, message: result.msg, recipients: result.recipients };
  }

  async listMyRooms(userId: string) {
    const parts = await this.prisma.chat_Room_Participant.findMany({
      where: { userId },
      select: { roomId: true },
      orderBy: { joinedAt: "desc" },
    });
    const roomIds = [...new Set(parts.map((p) => p.roomId))];
    if (roomIds.length === 0)
      return [] as Array<{
        roomId: string;
        counterpartUserId?: string;
        counterpartUsername?: string | null;
        lastMessage?: {
          id: string;
          content: string;
          senderId: string;
          createdAt: Date;
        } | null;
        updatedAt?: Date;
      }>;

    const rooms = await this.prisma.chat_Room.findMany({
      where: { id: { in: roomIds } },
      include: {
        participants: { select: { userId: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, content: true, senderId: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const counterpartIds = new Set<string>();
    for (const r of rooms) {
      let other = r.participants.find((p) => p.userId !== userId)?.userId;
      if (!other) {
        const latestOther = await this.prisma.message.findFirst({
          where: { roomId: r.id, senderId: { not: userId } },
          orderBy: { createdAt: "desc" },
          select: { senderId: true },
        });
        if (latestOther) other = latestOther.senderId;
      }
      if (other) counterpartIds.add(other);
    }
    const users = await this.prisma.user.findMany({
      where: { id: { in: [...counterpartIds] } },
      select: { id: true, username: true },
    });
    const idToName = new Map(users.map((u) => [u.id, u.username] as const));

    return rooms.map((r) => {
      let other = r.participants.find((p) => p.userId !== userId)?.userId;
      if (!other) {
        const msgOther = r.messages.find(
          (m) => m.senderId !== userId
        )?.senderId;
        if (msgOther) other = msgOther;
      }
      const lastMsg =
        (
          r as unknown as {
            messages: Array<{
              id: string;
              content: string;
              senderId: string;
              createdAt: Date;
            }>;
          }
        ).messages[0] ?? null;
      return {
        roomId: r.id,
        counterpartUserId: other,
        counterpartUsername: other ? idToName.get(other) ?? null : null,
        lastMessage: lastMsg,
        updatedAt: lastMsg?.createdAt ?? r["createdAt" as never],
      };
    });
  }

  async getRoomParticipantIds(roomId: string): Promise<string[]> {
    const parts = await this.prisma.chat_Room_Participant.findMany({
      where: { roomId },
      select: { userId: true },
    });
    return parts.map((p) => p.userId);
  }

  async getUnreadCount(userId: string, roomId: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<{ joinedAt: Date; lastReadAt: Date | null }[]>`
      SELECT "joinedAt", "lastReadAt"
      FROM "main"."Chat_Room_Participant"
      WHERE "userId" = ${userId} AND "roomId" = ${roomId}
      LIMIT 1
    `;
    const participant = rows[0];
    if (!participant) return 0;
    const baseline = participant.lastReadAt ?? participant.joinedAt;
    const count = await this.prisma.message.count({
      where: {
        roomId,
        senderId: { not: userId },
        createdAt: baseline ? { gt: baseline } : undefined,
      },
    });
    return count;
  }

  async getUnreadCountsForUser(userId: string): Promise<Record<string, number>> {
    const parts = await this.prisma.$queryRaw<{
      roomId: string;
      joinedAt: Date;
      lastReadAt: Date | null;
    }[]>`
      SELECT "roomId", "joinedAt", "lastReadAt"
      FROM "main"."Chat_Room_Participant"
      WHERE "userId" = ${userId}
    `;
    const result: Record<string, number> = {};
    for (const p of parts) {
      const baseline = p.lastReadAt ?? p.joinedAt;
      const count = await this.prisma.message.count({
        where: {
          roomId: p.roomId,
          senderId: { not: userId },
          createdAt: baseline ? { gt: baseline } : undefined,
        },
      });
      result[p.roomId] = count;
    }
    return result;
  }

  async markRoomRead(
    userId: string,
    roomId: string,
    when?: Date
  ): Promise<{ ok: boolean; lastReadAt?: Date }> {
    const participant = await this.prisma.chat_Room_Participant.findUnique({
      where: { userId_roomId: { userId, roomId } },
      select: { userId: true },
    });
    if (!participant) return { ok: false };
    const ts = when ?? new Date();
    const updated = await this.prisma.$executeRaw`
      UPDATE "main"."Chat_Room_Participant"
      SET "lastReadAt" = ${ts}
      WHERE "userId" = ${userId} AND "roomId" = ${roomId}
    `;
    if (typeof updated === "number" ? updated === 0 : updated === BigInt(0)) {
      return { ok: false };
    }
    return { ok: true, lastReadAt: ts };
  }
}
