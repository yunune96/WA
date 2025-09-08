import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../core/database/prisma.module";
import { CoinsController } from "./coins.controller";
import { CoinsService } from "./coins.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CoinsController],
  providers: [CoinsService],
  exports: [CoinsService],
})
export class CoinsModule {}


