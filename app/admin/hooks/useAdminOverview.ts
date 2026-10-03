"use client";

import { useQuery } from "@tanstack/react-query";
import type { AdminOverview } from "@/src/infrastructure/services/adminOverview";
import { adminJson } from "../lib/api";

export type { AdminOverview };

export function useAdminOverview(enabled = true) {
  return useQuery({
    queryKey: ["adminOverview"],
    queryFn: () => adminJson<AdminOverview>("/api/admin/overview"),
    enabled,
    staleTime: 60_000,
  });
}

/** Número de avisos que muestra la insignia del Panel. */
export function attentionCount(o: AdminOverview | undefined) {
  if (!o) return 0;
  const a = o.attention;
  return (
    (a.duplicates > 0 ? 1 : 0) +
    (a.missing > 0 ? 1 : 0) +
    a.itemsWithoutRule.length +
    (a.staleFullGear > 0 ? 1 : 0) +
    a.idleTokens.length
  );
}
