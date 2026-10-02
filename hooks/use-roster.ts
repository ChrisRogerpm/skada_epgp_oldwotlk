"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

export interface RosterAlter {
  name: string;
  class: string;
  icon: string;
}

export interface RosterMember {
  main: string;
  class: string;
  amount: number;
  icon: string;
  alters: RosterAlter[];
}

interface RosterResponse {
  roster: RosterMember[];
  date?: string;
  hour?: string;
}

/** Roster EPGP (/api/epgp) con ranking y búsqueda por main o alter. */
export function useRoster() {
  const query = useQuery<RosterResponse>({
    queryKey: ["epgpRoster"],
    queryFn: async () => {
      const res = await fetch("/api/epgp");
      if (!res.ok) throw new Error("Error al obtener el roster EPGP");
      return res.json();
    },
  });

  const roster = useMemo(() => query.data?.roster ?? [], [query.data]);

  const ranked = useMemo(() => [...roster].sort((a, b) => b.amount - a.amount), [roster]);

  const rankOf = useMemo(() => new Map(ranked.map((m, i) => [m.main, i + 1])), [ranked]);

  // nombre (main o alter, en minúsculas) → main al que pertenece
  const memberByName = useMemo(() => {
    const map = new Map<string, RosterMember>();
    roster.forEach((m) => {
      map.set(m.main.toLowerCase(), m);
      m.alters?.forEach((a) => map.set(a.name.toLowerCase(), m));
    });
    return map;
  }, [roster]);

  // nombre → clase/ícono del personaje concreto
  const characterInfo = useMemo(() => {
    const map = new Map<string, { class: string; icon: string }>();
    roster.forEach((m) => {
      map.set(m.main.toLowerCase(), { class: m.class, icon: m.icon });
      m.alters?.forEach((a) => map.set(a.name.toLowerCase(), { class: a.class, icon: a.icon }));
    });
    return map;
  }, [roster]);

  return {
    ...query,
    roster,
    ranked,
    rankOf,
    memberByName,
    characterInfo,
    maxPoints: ranked[0]?.amount ?? 1,
    updatedDate: query.data?.date,
    updatedHour: query.data?.hour,
  };
}
