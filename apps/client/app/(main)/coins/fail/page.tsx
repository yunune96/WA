"use client";
import { useSearchParams } from "next/navigation";

export default function CoinsFailPage() {
  const params = useSearchParams();
  const reason = params.get("reason") ?? "unknown";
  return (
    <div style={{ padding: 16 }}>
      <h1>결제가 완료되지 않았습니다.</h1>
      <p>사유: {reason}</p>
    </div>
  );
}
