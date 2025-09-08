import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class TossProvider {
  private readonly secretKey: string;
  constructor(private readonly config: ConfigService) {
    this.secretKey = this.config.get<string>("TOSS_SECRET_KEY") ?? "";
  }

  async prepare(orderId: string, amountKrw: number) {
    return {
      method: "toss",
      orderId,
      amount: amountKrw,
    };
  }

  async verify(payload: any): Promise<{ ok: boolean; orderId: string }> {
    const orderId = payload?.orderId as string;
    return { ok: Boolean(orderId), orderId };
  }

  async confirm(args: {
    paymentKey: string;
    orderId: string;
    amount: number;
  }): Promise<{ ok: boolean }> {
    const res = await fetch(
      "https://api.tosspayments.com/v1/payments/confirm",
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " + Buffer.from(`${this.secretKey}:`).toString("base64"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentKey: args.paymentKey,
          orderId: args.orderId,
          amount: args.amount,
        }),
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Toss confirm failed: ${res.status} ${text}`);
    }
    return { ok: true };
  }
}
