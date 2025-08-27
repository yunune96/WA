"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import SelectHobbiesForm from "@/components/auth/SelectHobbiesForm";

function SelectHobbiesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const backTo = searchParams.get("redirect_to") || "/";

  if (!userId) {
    if (typeof window !== "undefined") {
      router.replace("/login");
    }
    return <div>잘못된 접근입니다. 로그인 페이지로 이동합니다.</div>;
  }

  return <SelectHobbiesForm userId={userId} redirectTo={backTo} />;
}

export default function SelectHobbiesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SelectHobbiesPageContent />
    </Suspense>
  );
}
