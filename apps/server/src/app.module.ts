import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import * as Joi from "joi";

import { AuthModule } from "./auth/auth.module";
import { ChatModule } from "./chat/chat.module";
import { PrismaModule } from "./core/database/prisma.module";
import { RedisSetupModule } from "./core/redis/redis-setup.module";
import { HealthModule } from "./health/health.module";
import { HobbiesModule } from "./hobbies/hobbies.module";
import { LocationsModule } from "./locations/locations.module";
import { UsersModule } from "./users/users.module";
import { PaymentsModule } from "./payments/payments.module";
import { CoinsModule } from "./coins/coins.module";

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
        SERVER_PUBLIC_URL: Joi.string().uri().optional(),
        // OAuth (optional)
        GOOGLE_CLIENT_ID: Joi.string().optional(),
        GOOGLE_CLIENT_SECRET: Joi.string().optional(),
        GOOGLE_CALLBACK_URL: Joi.string().uri().optional(),
        KAKAO_CLIENT_ID: Joi.string().optional(),
        KAKAO_CLIENT_SECRET: Joi.string().optional(),
        KAKAO_CALLBACK_URL: Joi.string().uri().optional(),
        COIN_UNIT_PRICE: Joi.number().default(100),
        PAYMENT_PROVIDER: Joi.string().valid("toss", "kakao").optional(),
        TOSS_SECRET_KEY: Joi.string().optional(),
        TOSS_MOCK: Joi.boolean().optional().default(false),
        KAKAOPAY_ADMIN_KEY: Joi.string().optional(),
        KAKAOPAY_CID: Joi.string().optional(),
        KAKAOPAY_OPEN_SECRET_KEY: Joi.string().optional(),
        KAKAOPAY_OPEN_API_BASE: Joi.string().uri().optional(),
        PAYMENT_SUCCESS_URL: Joi.string().uri().optional(),
        PAYMENT_FAIL_URL: Joi.string().uri().optional(),
      }),
    }),
    RedisSetupModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    HobbiesModule,
    ChatModule,
    LocationsModule,
    HealthModule,
    PaymentsModule,
    CoinsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
