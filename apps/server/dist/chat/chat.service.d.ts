import { RedisService } from "../core/redis/redis.service";
interface ChatInvite {
    id: string;
    fromUserId: string;
    toUserId: string;
    createdAt: number;
    expiresAt: number;
    status: "pending" | "accepted" | "rejected";
    message?: string;
}
export declare class ChatService {
    private readonly redis;
    constructor(redis: RedisService);
    private key;
    private receivedSetKey;
    private sentSetKey;
    createInvite(fromUserId: string, toUserId: string, message?: string): Promise<ChatInvite>;
    getInvite(inviteId: string): Promise<ChatInvite | null>;
    acceptInvite(inviteId: string): Promise<{
        roomId: string;
    } | null>;
    rejectInvite(inviteId: string): Promise<boolean>;
    listReceivedPending(userId: string): Promise<ChatInvite[]>;
}
export {};
