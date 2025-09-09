import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PaymentProvider, PaymentStatus, Prisma } from "@prisma/client";

import { PrismaService } from "../core/database/prisma.service";
import { KakaoProvider } from "./providers/kakao.provider";
import { TossProvider } from "./providers/toss.provider";

export interface ProviderCheckoutResult {
  provider: PaymentProvider;
  orderId: string;
  amountKrw: number;
  payload: any;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly unitPrice: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly toss: TossProvider,
    private readonly kakao: KakaoProvider
  ) {
    this.unitPrice = Number(this.config.get("COIN_UNIT_PRICE") ?? 100);
  }

  private calcAmount(coins: number) {
    if (!Number.isInteger(coins) || coins <= 0) {
      throw new BadRequestException("coins must be a positive integer");
    }
    return coins * this.unitPrice;
  }

  async checkout(
    userId: string,
    coins: number,
    provider: "toss" | "kakao"
  ): Promise<ProviderCheckoutResult> {
    const amountKrw = this.calcAmount(coins);
    const order = await this.prisma.paymentOrder.create({
      data: {
        userId,
        coins,
        amountKrw,
        provider: provider as PaymentProvider,
        status: PaymentStatus.PENDING,
      },
    });

    if (provider === "toss") {
      const mock = this.config.get<boolean>("TOSS_MOCK") ?? false;
      if (mock) {
        // 모의결제: 주문만 만들고 프론트 성공 URL로 리다이렉트 안내
        const successUrl = this.buildClientSuccessUrl({
          orderId: order.id,
          coins,
          amountKrw,
          provider: PaymentProvider.toss,
        });
        return {
          provider: PaymentProvider.toss,
          orderId: order.id,
          amountKrw,
          payload: { mock: true, redirectUrl: successUrl },
        };
      }
      try {
        const payload = await this.toss.prepare(order.id, amountKrw);
        return {
          provider: PaymentProvider.toss,
          orderId: order.id,
          amountKrw,
          payload,
        };
      } catch (err: any) {
        this.logger.error(`Toss prepare error: ${err?.message || err}`);
        throw new BadRequestException("Toss 준비 요청 실패: 키/요청값을 확인하세요.");
      }
    }
    if (provider === "kakao") {
      try {
        const payload = await this.kakao.ready(order.id, amountKrw, userId);
        if (payload?.tid) {
          await this.prisma.paymentOrder.update({
            where: { id: order.id },
            data: { providerOrderId: payload.tid },
          });
        }
        return {
          provider: PaymentProvider.kakao,
          orderId: order.id,
          amountKrw,
          payload: { redirectUrl: payload.redirectUrl },
        };
      } catch (err: any) {
        this.logger.error(`Kakao ready error: ${err?.message || err}`);
        throw new BadRequestException(
          "Kakao ready 실패: KAKAOPAY_ADMIN_KEY/CID/Redirect URL을 확인하세요."
        );
      }
    }
    throw new BadRequestException("Unsupported provider");
  }

  async webhook(payload: any) {
    // provider 구분 및 서명 검증은 각각 provider에서 수행
    const type = payload?.provider as "toss" | "kakao" | undefined;
    if (!type) return { ok: true };
    if (type === "toss") {
      const result = await this.toss.verify(payload);
      if (result.ok) await this.applyPaid(result.orderId);
      return { ok: true };
    }
    if (type === "kakao") {
      const result = await this.kakao.verify(payload);
      if (result.ok) await this.applyPaid(result.orderId);
      return { ok: true };
    }
    return { ok: true };
  }

  async tossConfirm(body: {
    paymentKey: string;
    orderId: string;
    amount: number;
  }) {
    const order = await this.prisma.paymentOrder.findUnique({
      where: { id: body.orderId },
    });
    if (!order) throw new BadRequestException("order not found");
    const mock = this.config.get<boolean>("TOSS_MOCK") ?? false;
    // amount이 누락되거나 NaN이면 주문 금액으로 보정
    const normalizedAmount = Number.isFinite(body.amount)
      ? body.amount
      : order.amountKrw;
    // 모의결제일 때는 금액 불일치가 있더라도 승인 처리(개발 편의)
    if (!mock) {
      if (order.amountKrw !== normalizedAmount) {
        throw new BadRequestException("amount mismatch");
      }
      await this.toss.confirm({
        paymentKey: body.paymentKey,
        orderId: body.orderId,
        amount: normalizedAmount,
      });
      await this.prisma.paymentOrder.update({
        where: { id: body.orderId },
        data: { providerOrderId: body.paymentKey },
      });
    } else {
      // 모의결제: paymentKey 없이 바로 승인 처리
      // providerOrderId는 @unique 이므로 주문별로 유니크한 값으로 저장
      await this.prisma.paymentOrder.update({
        where: { id: body.orderId },
        data: { providerOrderId: `MOCK-${body.orderId}` },
      });
    }
    await this.applyPaid(body.orderId);
    return { ok: true };
  }

  async kakaoApprove(orderId: string, pgToken: string): Promise<string> {
    if (!orderId || !pgToken) {
      throw new BadRequestException("invalid kakao redirect params");
    }
    const order = await this.prisma.paymentOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new BadRequestException("order not found");
    const tid = order.providerOrderId || "";
    const approve = await this.kakao
      .approve({
        orderId,
        userId: order.userId,
        pgToken,
        tid,
        amountKrw: order.amountKrw,
      })
      .catch((err) => {
        this.logger.error(`Kakao approve error: ${err?.message || err}`);
        throw new BadRequestException("Kakao approve 실패");
      });
    if (!approve.ok) {
      throw new BadRequestException("kakao approve amount mismatch");
    }
    await this.applyPaid(orderId);
    return this.buildClientSuccessUrl({
      orderId,
      coins: order.coins,
      amountKrw: order.amountKrw,
      provider: order.provider,
    });
  }

  async buildClientFailUrl(reason: string): Promise<string> {
    const fallback =
      this.config.get<string>("FRONTEND_URL") ?? "http://localhost:3000";
    const base =
      this.config.get<string>("PAYMENT_FAIL_URL") ?? `${fallback}/coins/fail`;
    const url = new URL(base);
    url.searchParams.set("reason", reason);
    return url.toString();
  }

  private buildClientSuccessUrl(args: {
    orderId: string;
    coins: number;
    amountKrw: number;
    provider: PaymentProvider;
  }): string {
    const fallback =
      this.config.get<string>("FRONTEND_URL") ?? "http://localhost:3000";
    const base =
      this.config.get<string>("PAYMENT_SUCCESS_URL") ??
      `${fallback}/coins/success`;
    const url = new URL(base);
    url.searchParams.set("orderId", args.orderId);
    url.searchParams.set("coins", String(args.coins));
    url.searchParams.set("amountKrw", String(args.amountKrw));
    url.searchParams.set("provider", String(args.provider));
    return url.toString();
  }

  private async applyPaid(orderId: string) {
    await this.prisma.$transaction(async (tx) => {
      // 1) 상태 전이: PENDING -> PAID 를 원자적으로 시도
      const updated = await tx.paymentOrder.updateMany({
        where: { id: orderId, status: { not: PaymentStatus.PAID } },
        data: { status: PaymentStatus.PAID },
      });
      // 이미 다른 트랜잭션이 처리했다면 아무 것도 하지 않음(멱등)
      if (updated.count === 0) return;

      // 2) 최신 주문 정보 조회
      const order = await tx.paymentOrder.findUnique({ where: { id: orderId } });
      if (!order) return;

      // 3) 코인 적립 및 거래 기록
      await tx.wallet.upsert({
        where: { userId: order.userId },
        create: { userId: order.userId, balance: order.coins },
        update: { balance: { increment: order.coins } },
      });

      await tx.coinTransaction.create({
        data: {
          userId: order.userId,
          change: order.coins,
          reason: "purchase",
          orderId: order.id,
        },
      });
    });
  }
}
