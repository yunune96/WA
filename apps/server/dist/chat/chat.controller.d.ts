import { UserWithoutPassword } from "../shared/types/user.types";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";
export declare class ChatController {
    private readonly chatService;
    private readonly gateway;
    constructor(chatService: ChatService, gateway: ChatGateway);
    createInvite(me: UserWithoutPassword, body: {
        toUserId: string;
        message?: string;
    }): Promise<{
        inviteId: string;
    }>;
    acceptInvite(inviteId: string): Promise<{
        roomId: string;
    } | {
        error: string;
    }>;
    rejectInvite(inviteId: string): Promise<{
        ok: boolean;
    }>;
    cancelInvite(inviteId: string): Promise<{
        ok: boolean;
    }>;
    listReceivedPending(me: UserWithoutPassword): Promise<{
        invites: Array<{
            id: string;
            fromUserId: string;
            toUserId: string;
            message?: string;
        }>;
    }>;
}
