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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../core/redis/redis.service");
let ChatService = class ChatService {
    constructor(redis) {
        this.redis = redis;
    }
    key(inviteId) {
        return `chat:invite:${inviteId}`;
    }
    receivedSetKey(userId) {
        return `chat:user:${userId}:invites:received`;
    }
    sentSetKey(userId) {
        return `chat:user:${userId}:invites:sent`;
    }
    async createInvite(fromUserId, toUserId, message) {
        const invite = {
            id: (0, crypto_1.randomUUID)(),
            fromUserId,
            toUserId,
            createdAt: Date.now(),
            expiresAt: Date.now() + 10 * 60 * 1000, // 10m
            status: "pending",
            message,
        };
        await this.redis.setex(this.key(invite.id), 10 * 60, JSON.stringify(invite));
        // index sets for quick lookup
        await this.redis.sadd(this.receivedSetKey(toUserId), invite.id);
        await this.redis.sadd(this.sentSetKey(fromUserId), invite.id);
        return invite;
    }
    async getInvite(inviteId) {
        const raw = await this.redis.get(this.key(inviteId));
        return raw ? JSON.parse(raw) : null;
    }
    async acceptInvite(inviteId) {
        const inv = await this.getInvite(inviteId);
        if (!inv || inv.status !== "pending")
            return null;
        inv.status = "accepted";
        const roomId = `room:${inv.fromUserId}:${inv.toUserId}`;
        await this.redis.setex(this.key(inviteId), 5 * 60, JSON.stringify(inv));
        return { roomId };
    }
    async rejectInvite(inviteId) {
        const inv = await this.getInvite(inviteId);
        if (!inv || inv.status !== "pending")
            return false;
        inv.status = "rejected";
        await this.redis.setex(this.key(inviteId), 2 * 60, JSON.stringify(inv));
        return true;
    }
    async listReceivedPending(userId) {
        const ids = await this.redis.smembers(this.receivedSetKey(userId));
        if (!ids || ids.length === 0)
            return [];
        const invites = await Promise.all(ids.map((id) => this.getInvite(id)));
        return invites.filter((v) => !!v && v.status === "pending");
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], ChatService);
//# sourceMappingURL=chat.service.js.map