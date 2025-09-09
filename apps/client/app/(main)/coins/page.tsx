"use client";
import { useMemo, useState } from "react";
import { paymentsApi, coinsApi } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { loadPaymentWidget } from "@tosspayments/payment-widget-sdk";
import styles from "@/styles/Coins.module.css";

export default function CoinsPage() {
  const [coins, setCoins] = useState(50);
  const [provider, setProvider] = useState<"toss" | "kakao">("toss");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const params = useSearchParams();

  const packs = useMemo(
    () => [
      { coins: 10, price: 1000 },
      { coins: 50, price: 5000 },
      { coins: 100, price: 10000 },
    ],
    []
  );

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
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.title}>💰 코인 충전</div>
        <div className={styles.providerRow}>
          <button
            className={`${styles.brandBtn} ${
              provider === "toss" ? styles.activeTossBtn : ""
            }`}
            onClick={() => setProvider("toss")}
            aria-pressed={provider === "toss"}
            aria-label="토스페이"
            title="토스페이"
          >
            <img src="/brands/toss.svg" alt="" className={styles.brandImgLarge} />
          </button>
          <button
            className={`${styles.brandBtn} ${
              provider === "kakao" ? styles.activeKakaoBtn : ""
            }`}
            onClick={() => setProvider("kakao")}
            aria-pressed={provider === "kakao"}
            aria-label="카카오페이"
            title="카카오페이"
          >
            <img src="/brands/kakaopay.svg" alt="" className={styles.brandImgLarge} />
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        {packs.map((p) => (
          <div key={p.coins} className={styles.pack}>
            <div className={styles.coins}>{p.coins} 코인</div>
            <div className={styles.price}>₩{p.price.toLocaleString()}</div>
            <button
              className={styles.buyBtn}
              onClick={() => setCoins(p.coins)}
              disabled={loading}
            >
              {coins === p.coins ? "선택됨" : "선택"}
            </button>
          </div>
        ))}
      </div>

      <div style={{ height: 8 }} />
      <button
        onClick={handleCheckout}
        className={styles.buyBtn}
        disabled={loading}
      >
        {loading ? "결제 준비 중..." : `${coins}코인 결제하기`}
      </button>
      {message && <p style={{ marginTop: 12 }}>{message}</p>}

      <div className={styles.divider} />
      <div className={styles.widgetArea}>
        <div id="payment-widget" />
        <div id="agreement" />
      </div>
      <div className={styles.balancePanel}>
        <BalancePanel />
      </div>
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
      <button onClick={refresh} className={styles.refreshBtn}>
        🔄 잔액/내역 새로고침
      </button>
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
