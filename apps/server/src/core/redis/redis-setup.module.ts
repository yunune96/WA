// import { RedisModule } from "@liaoliaots/nestjs-redis";
// import { Module } from "@nestjs/common";
// import { ConfigModule } from "@nestjs/config";

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

import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: "REDIS_CLIENT",

      useFactory: (configService: ConfigService): Redis => {
        const host = configService.get<string>("REDIS_HOST");
        const port = configService.get<number>("REDIS_PORT");
        const password = configService.get<string>("REDIS_PASSWORD");

        if (!host || !port) {
          throw new Error("Redis host or port is not defined in .env file");
        }

        return new Redis({
          host,
          port,
          password: password || undefined,
          maxRetriesPerRequest: null,
        });
      },

      inject: [ConfigService],
    },
  ],
  exports: ["REDIS_CLIENT"],
})
export class RedisSetupModule {}
