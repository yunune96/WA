"use client";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { coinsApi } from "@/lib/api";
import { paymentsApi } from "@/lib/api";

export default function CoinsSuccessPage() {
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const coins = params.get("coins");
  const amountKrw = params.get("amountKrw");
  const provider = params.get("provider");

  useEffect(() => {
    coinsApi.getBalance();
    const paymentKey = params.get("paymentKey");
    const orderIdQ = params.get("orderId");
    const amountFromWidget = params.get("amount");
    const amountFromQuery = params.get("amountKrw");
    const amount = amountFromWidget
      ? Number(amountFromWidget)
      : amountFromQuery
      ? Number(amountFromQuery)
      : NaN;

    // Toss: 위젯 성공( paymentKey 존재 ) 또는 모의결제(TOSS_MOCK, paymentKey 없음) 모두 승인 호출
    // React StrictMode(dev)에서 useEffect가 두 번 실행되는 것을 방지하기 위한 가드
    const onceKey = orderIdQ ? `toss_confirmed_${orderIdQ}` : null;
    const alreadyDone = onceKey ? sessionStorage.getItem(onceKey) === "1" : true;
    if (provider === "toss" && orderIdQ && !Number.isNaN(amount) && !alreadyDone) {
      sessionStorage.setItem(onceKey!, "1");
      paymentsApi
        .tossConfirm(paymentKey ?? "MOCK", orderIdQ, amount)
        .then(() => {
          coinsApi.getBalance();
        })
        .catch(() => {});
    }
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1>결제가 완료되었습니다.</h1>
      <p>주문번호: {orderId}</p>
      <p>코인: {coins}</p>
      <p>금액: ₩{amountKrw}</p>
      <p>PG: {provider}</p>
    </div>
  );
}
