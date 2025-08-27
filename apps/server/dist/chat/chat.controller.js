"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const user_decorator_1 = require("../auth/decorators/user.decorator");
const chat_gateway_1 = require("./chat.gateway");
const chat_service_1 = require("./chat.service");
let ChatController = class ChatController {
    constructor(chatService, gateway) {
        this.chatService = chatService;
        this.gateway = gateway;
    }
    async createInvite(me, body) {
        const invite = await this.chatService.createInvite(me.id, body.toUserId, body.message);
        this.gateway.emitToUser(body.toUserId, "invite:new", {
            inviteId: invite.id,
            fromUserId: me.id,
            message: invite.message ?? null,
        });
        return { inviteId: invite.id };
    }
    async acceptInvite(inviteId) {
        const room = await this.chatService.acceptInvite(inviteId);
        if (!room)
            return { error: "invalid_invite" };
        const inv = await this.chatService.getInvite(inviteId);
        if (inv) {
            this.gateway.emitToUser(inv.fromUserId, "invite:update", {
                inviteId,
                status: "accepted",
                roomId: room.roomId,
            });
        }
        return room;
    }
    async rejectInvite(inviteId) {
        const ok = await this.chatService.rejectInvite(inviteId);
        const inv = await this.chatService.getInvite(inviteId);
        if (ok && inv) {
            this.gateway.emitToUser(inv.fromUserId, "invite:update", {
                inviteId,
                status: "rejected",
            });
        }
        return { ok };
    }
    async cancelInvite(inviteId) {
        const ok = await this.chatService.rejectInvite(inviteId);
        return { ok };
    }
    async listReceivedPending(me) {
        const list = await this.chatService.listReceivedPending(me.id);
        const shaped = list.map((i) => ({
            id: i.id,
            fromUserId: i.fromUserId,
            toUserId: i.toUserId,
            message: i.message,
        }));
        return { invites: shaped };
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)("/invites"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, user_decorator_1.User)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createInvite", null);
__decorate([
    (0, common_1.Post)("/invites/:inviteId/accept"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)("inviteId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "acceptInvite", null);
__decorate([
    (0, common_1.Post)("/invites/:inviteId/reject"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)("inviteId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "rejectInvite", null);
__decorate([
    (0, common_1.Post)("/invites/:inviteId/cancel"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)("inviteId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "cancelInvite", null);
__decorate([
    (0, common_1.Post)("/invites/received/pending"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "listReceivedPending", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.Controller)("chat"),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        chat_gateway_1.ChatGateway])
], ChatController);
//# sourceMappingURL=chat.controller.js.map