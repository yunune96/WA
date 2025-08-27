"use strict";
// import { RedisModule } from "@liaoliaots/nestjs-redis";
// import { Module } from "@nestjs/common";
// import { ConfigModule } from "@nestjs/config";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisSetupModule = void 0;
// import { RedisConfigService } from "./redis-config.service";
// @Module({
//   imports: [
//     RedisModule.forRootAsync({
//       imports: [ConfigModule],
//       useClass: RedisConfigService,
//     }),
//   ],
//   exports: [RedisModule],
// })
// export class RedisSetupModule {}
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
let RedisSetupModule = class RedisSetupModule {
};
exports.RedisSetupModule = RedisSetupModule;
exports.RedisSetupModule = RedisSetupModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            {
                provide: "REDIS_CLIENT",
                useFactory: (configService) => {
                    const host = configService.get("REDIS_HOST");
                    const port = configService.get("REDIS_PORT");
                    const password = configService.get("REDIS_PASSWORD");
                    if (!host || !port) {
                        throw new Error("Redis host or port is not defined in .env file");
                    }
                    return new ioredis_1.Redis({
                        host,
                        port,
                        password: password || undefined,
                        maxRetriesPerRequest: null,
                    });
                },
                inject: [config_1.ConfigService],
            },
        ],
        exports: ["REDIS_CLIENT"],
    })
], RedisSetupModule);
//# sourceMappingURL=redis-setup.module.js.map