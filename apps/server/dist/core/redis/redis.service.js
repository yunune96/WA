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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisService = RedisService_1 = class RedisService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(RedisService_1.name);
    }
    onModuleInit() {
        const redisOptions = {
            host: this.configService.get("REDIS_HOST", "localhost"),
            port: this.configService.get("REDIS_PORT", 6379),
            password: this.configService.get("REDIS_PASSWORD"),
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
                if (times > 10) {
                    this.logger.error("Redis 재연결 시도 횟수 초과. 연결을 중단합니다.");
                    return null;
                }
                const delay = Math.min(times * 100, 3000);
                this.logger.warn(`Redis 연결이 끊겼습니다. ${delay}ms 후 ${times}번째 재연결을 시도합니다.`);
                return delay;
            },
        };
        this.client = new ioredis_1.default(redisOptions);
        this.client.on("error", (error) => {
            this.logger.error("Redis 연결 에러:", error);
        });
        this.client.on("connect", () => {
            this.logger.log("Redis 연결 성공");
        });
    }
    async get(key) {
        return await this.client.get(key);
    }
    async set(key, value) {
        return await this.client.set(key, value);
    }
    async setex(key, seconds, value) {
        return await this.client.setex(key, seconds, value);
    }
    async del(key) {
        return await this.client.del(key);
    }
    async exists(key) {
        return await this.client.exists(key);
    }
    async expire(key, seconds) {
        return await this.client.expire(key, seconds);
    }
    // Set operations
    async sadd(key, ...members) {
        return await this.client.sadd(key, ...members);
    }
    async smembers(key) {
        return await this.client.smembers(key);
    }
    async onModuleDestroy() {
        await this.client.quit();
        this.logger.log("Redis 연결을 정상적으로 종료했습니다.");
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map