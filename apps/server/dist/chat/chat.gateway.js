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
exports.ChatGateway = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const websockets_1 = require("@nestjs/websockets");
let ChatGateway = class ChatGateway {
    constructor(jwtService) {
        this.jwtService = jwtService;
        this.userIdToSocketIds = new Map();
    }
    async handleConnection(client) {
        try {
            const tokenFromAuth = client.handshake.auth?.token || undefined;
            const cookieHeader = client.handshake.headers.cookie || "";
            const tokenFromCookie = parseCookie(cookieHeader)["accessToken"];
            const token = tokenFromAuth || tokenFromCookie;
            if (!token)
                throw new Error("No token");
            const payload = this.jwtService.verify(token);
            const userId = payload.sub;
            client.data.userId = userId;
            const set = this.userIdToSocketIds.get(userId) ?? new Set();
            set.add(client.id);
            this.userIdToSocketIds.set(userId, set);
        }
        catch {
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        const userId = client.data.userId;
        if (!userId)
            return;
        const set = this.userIdToSocketIds.get(userId);
        if (!set)
            return;
        set.delete(client.id);
        if (set.size === 0)
            this.userIdToSocketIds.delete(userId);
    }
    emitToUser(userId, event, payload) {
        const set = this.userIdToSocketIds.get(userId);
        if (!set)
            return;
        for (const socketId of set)
            this.server.to(socketId).emit(event, payload);
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", Function)
], ChatGateway.prototype, "server", void 0);
exports.ChatGateway = ChatGateway = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.NEXT_PUBLIC_CLIENT_URL || true,
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], ChatGateway);
function parseCookie(cookie) {
    const result = {};
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
//# sourceMappingURL=chat.gateway.js.map