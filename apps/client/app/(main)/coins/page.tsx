"use client";
import { useState } from "react";
import { paymentsApi, coinsApi } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { loadPaymentWidget } from "@tosspayments/payment-widget-sdk";

export default function CoinsPage() {
  const [coins, setCoins] = useState(10);
  const [provider, setProvider] = useState<"toss" | "kakao">("toss");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const params = useSearchParams();

  const handleCheckout = async () => {
    setLoading(true);
    setMessage(null);
    const resp = await paymentsApi.checkout(coins, provider);
    setLoading(false);
    if (resp.error) {
      setMessage(resp.error);
      return;
    }
    const data = resp.data!;
    if (data.provider === "kakao" && data.payload?.redirectUrl) {
      window.location.href = data.payload.redirectUrl as string;
      return;
    }
    if (data.provider === "toss") {
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;
      const customerKey =
        typeof window !== "undefined"
          ? localStorage.getItem("uid") ?? "guest"
          : "guest";
      if (data.payload?.mock && data.payload?.redirectUrl) {
        window.location.href = data.payload.redirectUrl as string;
        return;
      }
      const widget = await loadPaymentWidget(clientKey, customerKey);
      await widget.renderPaymentMethods("#payment-widget", {
        value: data.amountKrw,
      });
      await widget.renderAgreement("#agreement");
      await widget.requestPayment({
        orderId: data.orderId,
        orderName: `${coins}코인`,
        successUrl: process.env.NEXT_PUBLIC_TOSS_SUCCESS_URL!,
        failUrl: process.env.NEXT_PUBLIC_TOSS_FAIL_URL!,
      });
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h1>코인 구매</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[10, 50, 100].map((c) => (
          <button key={c} onClick={() => setCoins(c)} disabled={loading}>
            {c}코인 (₩{c * 100})
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <label>
          <input
            type="radio"
            name="provider"
            checked={provider === "toss"}
            onChange={() => setProvider("toss")}
          />
          토스페이먼츠
        </label>
        <label>
          <input
            type="radio"
            name="provider"
            checked={provider === "kakao"}
            onChange={() => setProvider("kakao")}
          />
          카카오페이
        </label>
      </div>
      <button onClick={handleCheckout} disabled={loading}>
        {loading ? "처리 중..." : `${coins}코인 결제하기`}
      </button>
      {message && <p style={{ marginTop: 12 }}>{message}</p>}

      <hr style={{ margin: "16px 0" }} />
      <div id="payment-widget" />
      <div id="agreement" />
      <BalancePanel />
    </div>
  );
}

function BalancePanel() {
  const [balance, setBalance] = useState<number>();
  const [txs, setTxs] = useState<
    Array<{ id: string; change: number; reason: string; createdAt: string }>
  >([]);

  const refresh = async () => {
    const b = await coinsApi.getBalance();
    if (!b.error) setBalance(b.data!.balance);
    const t = await coinsApi.getTransactions();
    if (!t.error) setTxs(t.data!);
  };

  return (
    <div>
      <button onClick={refresh}>잔액/내역 새로고침</button>
      <div style={{ marginTop: 8 }}>잔액: {balance ?? "-"} 코인</div>
      <ul>
        {txs.map((t) => (
          <li key={t.id}>
            {t.createdAt}: {t.change > 0 ? "+" : ""}
            {t.change} ({t.reason})
          </li>
        ))}
      </ul>
    </div>
  );
}
