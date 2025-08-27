"use client";
import { useEffect } from "react";

import MatchesView from "@/components/features/MatchesView";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import type { MatchedUser } from "@/types/user.types";

export default function MatchesPage() {
  const { ready } = useRequireAuth();
  useEffect(() => {}, [ready]);
  if (!ready) return null;
  const initialUsers: MatchedUser[] = [];
  return <MatchesView initialUsers={initialUsers} />;
}
