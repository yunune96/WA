// import {
//   RedisModuleOptions,
//   RedisOptionsFactory,
// } from "@liaoliaots/nestjs-redis";
// import { Injectable } from "@nestjs/common";
// import { ConfigService } from "@nestjs/config";

// @Injectable()
// export class RedisConfigService implements RedisOptionsFactory {
//   constructor(private readonly configService: ConfigService) {}

//   createRedisOptions(): RedisModuleOptions {
//     const host = this.configService.get<string>("REDIS_HOST")!;
//     const port = this.configService.get<number>("REDIS_PORT")!;
//     const password = this.configService.get<string>("REDIS_PASSWORD");

//     if (!host || !port) {
//       throw new Error("Redis host or port is not defined in .env file");
//     }

//     return {
//       config: {
//         host,
//         port,
//         ...(password && { password }),
//       },
//     };
//   }
// }
