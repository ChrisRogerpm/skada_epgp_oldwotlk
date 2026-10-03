"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { LootRuleUIItem } from "@/app/types/Reglas";

type ReglasResponse = Record<string, unknown>[];

interface RawLootRule {
  id: string;
  raidCode: LootRuleUIItem["raidCode"];
  category: string;
  item: string;
  icon: string;
  idItem?: number | null;
  valueMin: number;
  requirement?: string[];
}

/** Reglas de loteo publicadas (/api/reglas) en forma plana, con el mínimo por ítem. */
export function useLootRules() {
  const query = useQuery<ReglasResponse>({
    queryKey: ["reglas"],
    queryFn: async () => {
      const res = await fetch("/api/reglas");
      if (!res.ok) throw new Error("Error al obtener las reglas");
      return res.json();
    },
  });

  const rules = useMemo<LootRuleUIItem[]>(() => {
    const section = (query.data ?? []).find((s) => s["Reglas de Loteo"])?.["Reglas de Loteo"] as
      | { items?: RawLootRule[] }[]
      | undefined;
    return (section ?? []).flatMap((group) =>
      (group.items ?? []).map((item) => ({
        id: item.id,
        raidCode: item.raidCode,
        category: item.category,
        name: item.item,
        icon: item.icon,
        idItem: item.idItem ?? null,
        valueMin: item.valueMin,
        requirement: item.requirement ?? [],
      })),
    );
  }, [query.data]);

  const minByItem = useMemo(() => {
    const map = new Map<number, number>();
    rules.forEach((r) => r.idItem && map.set(r.idItem, r.valueMin));
    return map;
  }, [rules]);

  return { ...query, rules, minByItem };
}
