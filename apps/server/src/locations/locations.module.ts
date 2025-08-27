import { Module } from "@nestjs/common";

import { PrismaModule } from "../core/database/prisma.module";
import { RedisSetupModule } from "../core/redis/redis-setup.module";

import { LocationsController } from "./locations.controller";
import { LocationsService } from "./locations.service";

@Module({
  imports: [PrismaModule, RedisSetupModule],
  controllers: [LocationsController],
  providers: [LocationsService],
})
export class LocationsModule {}
