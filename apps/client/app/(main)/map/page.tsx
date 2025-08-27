"use client";
import { useEffect } from "react";

import MapView from "@/components/features/MapView";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function MapPage() {
  const { ready } = useRequireAuth();
  useEffect(() => {}, [ready]);
  if (!ready) return null;
  return <MapView />;
}
