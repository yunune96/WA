import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import * as Joi from "joi";

import { AuthModule } from "./auth/auth.module";
import { ChatModule } from "./chat/chat.module";
import { PrismaModule } from "./core/database/prisma.module";
import { RedisSetupModule } from "./core/redis/redis-setup.module";
import { HobbiesModule } from "./hobbies/hobbies.module";
import { LocationsModule } from "./locations/locations.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid("development", "production", "test")
          .default("development"),
        PORT: Joi.number().default(3001),
        DB_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().default("1h"),
        FRONTEND_URL: Joi.string().required(),
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().required(),
        REDIS_PASSWORD: Joi.string().optional().allow(""),
      }),
    }),
    RedisSetupModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    HobbiesModule,
    ChatModule,
    LocationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
