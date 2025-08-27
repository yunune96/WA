import { Module } from "@nestjs/common";

import { PrismaModule } from "../core/database/prisma.module";
import { RedisSetupModule } from "../core/redis/redis-setup.module";

import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [PrismaModule, RedisSetupModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
