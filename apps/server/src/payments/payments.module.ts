import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { PrismaModule } from "../core/database/prisma.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { KakaoProvider } from "./providers/kakao.provider";
import { TossProvider } from "./providers/toss.provider";

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, TossProvider, KakaoProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}


