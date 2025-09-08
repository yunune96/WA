import { Body, Controller, Get, Post, Query, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";

import { User } from "../auth/decorators/user.decorator";
import { PaymentsService } from "./payments.service";
import { CheckoutDto } from "./dto/checkout.dto";

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("checkout")
  @UseGuards(AuthGuard("jwt"))
  @ApiOperation({ summary: "코인 결제 체크아웃(서버 금액 계산)" })
  async checkout(@User("id") userId: string, @Body() dto: CheckoutDto) {
    return this.paymentsService.checkout(userId, dto.coins, dto.provider);
  }

  @Post("webhook")
  @ApiOperation({ summary: "PG 웹훅(승인/취소 등)" })
  async webhook(@Body() payload: any) {
    return this.paymentsService.webhook(payload);
  }

  // KakaoPay redirect endpoints
  @Get("kakao/success")
  @ApiOperation({ summary: "카카오페이 성공 리다이렉트 (pg_token 수신)" })
  async kakaoSuccess(
    @Query("orderId") orderId: string,
    @Query("pg_token") pgToken: string,
    @Res() res: Response
  ) {
    const frontendUrl = await this.paymentsService.kakaoApprove(orderId, pgToken);
    return res.redirect(frontendUrl);
  }

  @Get("kakao/cancel")
  @ApiOperation({ summary: "카카오페이 취소 리다이렉트" })
  async kakaoCancel(@Res() res: Response) {
    const url = await this.paymentsService.buildClientFailUrl("canceled");
    return res.redirect(url);
  }

  @Get("kakao/fail")
  @ApiOperation({ summary: "카카오페이 실패 리다이렉트" })
  async kakaoFail(@Res() res: Response) {
    const url = await this.paymentsService.buildClientFailUrl("failed");
    return res.redirect(url);
  }

  // Toss confirm (클라이언트 위젯 결제 완료 후 서버 승인)
  @Post("toss/confirm")
  @ApiOperation({ summary: "토스 결제 승인(confirm)" })
  async tossConfirm(
    @Body()
    body: {
      paymentKey: string;
      orderId: string;
      amount: number;
    }
  ) {
    return this.paymentsService.tossConfirm(body);
  }

  // 일부 환경에서 GET으로 접근하는 경우를 위한 폴백
  @Get("toss/confirm")
  @ApiOperation({ summary: "토스 결제 승인(confirm) - GET 폴백" })
  async tossConfirmGet(
    @Query("paymentKey") paymentKey: string | undefined,
    @Query("orderId") orderId: string,
    @Query("amount") amountStr: string
  ) {
    const amount = Number(amountStr);
    return this.paymentsService.tossConfirm({
      paymentKey: paymentKey || "MOCK",
      orderId,
      amount,
    });
  }
}


