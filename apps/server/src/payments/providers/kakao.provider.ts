import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class KakaoProvider {
  private readonly adminKey: string;
  private readonly cid: string;
  private readonly openSecretKey: string;
  private readonly openApiBase?: string;
  constructor(private readonly config: ConfigService) {
    this.adminKey = this.config.get<string>("KAKAOPAY_ADMIN_KEY") ?? "";
    this.cid = this.config.get<string>("KAKAOPAY_CID") ?? "TC0ONETIME";
    this.openSecretKey =
      this.config.get<string>("KAKAOPAY_OPEN_SECRET_KEY") ?? "";
    this.openApiBase = this.config.get<string>("KAKAOPAY_OPEN_API_BASE") || undefined;
  }

  async ready(orderId: string, amountKrw: number, userId: string) {
    const serverBase =
      this.config.get<string>("SERVER_PUBLIC_URL") ?? "http://localhost:3001";
    const successUrl = `${serverBase}/api/payments/kakao/success?orderId=${encodeURIComponent(
      orderId
    )}`;
    const cancelUrl = `${serverBase}/api/payments/kakao/cancel`;
    const failUrl = `${serverBase}/api/payments/kakao/fail`;

    // Open API 사용 시 JSON + SECRET_KEY 헤더로 호출
    const useOpen = Boolean(this.openApiBase && this.openSecretKey);
    const res = await (async () => {
      if (useOpen) {
        return fetch(`${this.openApiBase}/online/v1/payment/ready`, {
          method: "POST",
          headers: {
            Authorization: `SECRET_KEY ${this.openSecretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cid: this.cid,
            partner_order_id: orderId,
            partner_user_id: userId,
            item_name: "Coins",
            quantity: 1,
            total_amount: amountKrw,
            tax_free_amount: 0,
            approval_url: successUrl,
            cancel_url: cancelUrl,
            fail_url: failUrl,
          }),
        });
      }
      const body = new URLSearchParams({
        cid: this.cid,
        partner_order_id: orderId,
        partner_user_id: userId,
        item_name: "Coins",
        quantity: "1",
        total_amount: String(amountKrw),
        tax_free_amount: "0",
        approval_url: successUrl,
        cancel_url: cancelUrl,
        fail_url: failUrl,
      });
      return fetch("https://kapi.kakao.com/v1/payment/ready", {
        method: "POST",
        headers: {
          Authorization: `KakaoAK ${this.adminKey}`,
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        },
        body,
      });
    })();
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Kakao ready failed: ${res.status} ${text}`);
    }
    const data = (await res.json()) as {
      tid: string;
      next_redirect_pc_url?: string;
      next_redirect_mobile_url?: string;
    };
    return {
      method: "kakao",
      orderId,
      amount: amountKrw,
      tid: data.tid,
      redirectUrl:
        data.next_redirect_pc_url || data.next_redirect_mobile_url || "",
    };
  }

  async verify(payload: any): Promise<{ ok: boolean; orderId: string }> {
    const orderId = payload?.orderId as string;
    return { ok: Boolean(orderId), orderId };
  }

  async approve(args: {
    orderId: string;
    userId: string;
    pgToken: string;
    tid: string;
    amountKrw: number;
  }): Promise<{ ok: boolean; totalAmount: number }> {
    const useOpen = Boolean(this.openApiBase && this.openSecretKey);
    const res = await (async () => {
      if (useOpen) {
        return fetch(`${this.openApiBase}/online/v1/payment/approve`, {
          method: "POST",
          headers: {
            Authorization: `SECRET_KEY ${this.openSecretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cid: this.cid,
            tid: args.tid,
            partner_order_id: args.orderId,
            partner_user_id: args.userId,
            pg_token: args.pgToken,
          }),
        });
      }
      const body = new URLSearchParams({
        cid: this.cid,
        tid: args.tid,
        partner_order_id: args.orderId,
        partner_user_id: args.userId,
        pg_token: args.pgToken,
      });
      return fetch("https://kapi.kakao.com/v1/payment/approve", {
        method: "POST",
        headers: {
          Authorization: `KakaoAK ${this.adminKey}`,
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        },
        body,
      });
    })();
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Kakao approve failed: ${res.status} ${text}`);
    }
    const data = (await res.json()) as { amount?: { total?: number } };
    const total = Number(data?.amount?.total ?? 0);
    return { ok: total === args.amountKrw, totalAmount: total };
  }
}
