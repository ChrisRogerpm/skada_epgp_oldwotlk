import { getSupabaseAdmin } from "@/src/infrastructure/config/supabaseAdmin";
import type { RaidInfo } from "@/app/types/RaidComposition";
import { groupSessions } from "@/lib/raids";
import { limaIsoDate } from "@/lib/wow";
import { syncRaidItemsTask } from "./syncRaidItems";

export interface AdminOverviewSession {
  label: string;
  short: string;
  size: 10 | 25;
  run: number;
  runs: number;
  start: string;
  lastBoss: string;
  items: number;
}

export interface AdminOverview {
  lastSync: { at: string; tokenName: string } | null;
  week: {
    sessions: number;
    byRaid: { short: string; count: number }[];
    lootSync: number;
    lootManual: number;
  };
  lastNight: { date: string; sessions: AdminOverviewSession[] } | null;
  attention: {
    /** Filas del sync que sobran (copias entre jefes o entregas anuladas) en los últimos 7 días. */
    duplicates: number;
    /** Entregas de los logs EPGP que aún no están en raid_items. */
    missing: number;
    itemsWithoutRule: { raid: string; count: number }[];
    staleFullGear: number;
    idleTokens: { id: string; name: string; lastUsedAt: string | null }[];
  };
}

const DAY_MS = 24 * 3600 * 1000;

function lastDays(n: number) {
  return Array.from({ length: n }, (_, i) => limaIsoDate(new Date(Date.now() - i * DAY_MS)));
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = getSupabaseAdmin();
  const weekAgo = new Date(Date.now() - 7 * DAY_MS).toISOString();

  const [tokensRes, raidsRes, syncCount, manualCount, itemsRes, rulesRes, fullGearRes, dryRun] =
    await Promise.all([
      supabase
        .from("sync_api_tokens")
        .select("id, name, last_used_at, created_at, revoked_at, expires_at"),
      supabase
        .from("raids")
        .select("id, raid_id_key, raid_date, raid_time, boss_name, created_at")
        .in("raid_date", lastDays(7))
        .order("raid_date")
        .order("raid_time"),
      supabase
        .from("raid_items")
        .select("id", { count: "exact", head: true })
        .eq("source", "sync")
        .gte("created_at", weekAgo),
      supabase
        .from("raid_items")
        .select("id", { count: "exact", head: true })
        .eq("source", "manual")
        .gte("created_at", weekAgo),
      supabase.from("items").select("id_item, raid"),
      supabase.from("reglas_loteo").select("id_item"),
      supabase.from("full_geared_characters").select("updated_at, created_at"),
      syncRaidItemsTask({ lookbackDays: 7, dryRun: true }).catch((error) => {
        console.error("Overview: no se pudo simular el sync de ítems:", error);
        return null;
      }),
    ]);

  for (const res of [tokensRes, raidsRes, syncCount, manualCount, itemsRes, rulesRes, fullGearRes]) {
    if (res.error) throw new Error(res.error.message);
  }

  const now = Date.now();
  const tokens = tokensRes.data ?? [];
  const active = tokens.filter(
    (t) => !t.revoked_at && (!t.expires_at || new Date(t.expires_at).getTime() > now),
  );
  const lastUsed = tokens
    .filter((t) => t.last_used_at)
    .sort((a, b) => (a.last_used_at! < b.last_used_at! ? 1 : -1))[0];
  const idleTokens = active
    .filter((t) => {
      const ref = t.last_used_at ?? t.created_at;
      return now - new Date(ref).getTime() > 7 * DAY_MS;
    })
    .map((t) => ({ id: t.id, name: t.name, lastUsedAt: t.last_used_at }));

  // Encuentros de la semana agrupados en raids (mismo criterio que la página Raids).
  const raids = raidsRes.data ?? [];
  const raidIds = raids.map((r) => r.id);
  const participantCount = new Map<string, number>();
  const itemCount = new Map<string, number>();
  if (raidIds.length) {
    const [partsRes, lootRes] = await Promise.all([
      supabase.from("raid_participants").select("raid_id").in("raid_id", raidIds).limit(5000),
      supabase.from("raid_items").select("id_raids").in("id_raids", raidIds).limit(5000),
    ]);
    if (partsRes.error) throw new Error(partsRes.error.message);
    if (lootRes.error) throw new Error(lootRes.error.message);
    for (const p of partsRes.data ?? [])
      participantCount.set(p.raid_id, (participantCount.get(p.raid_id) ?? 0) + 1);
    for (const l of lootRes.data ?? [])
      itemCount.set(l.id_raids, (itemCount.get(l.id_raids) ?? 0) + 1);
  }

  const byDate = new Map<string, RaidInfo[]>();
  for (const r of raids) {
    const info = {
      ...r,
      participants: Array.from({ length: participantCount.get(r.id) ?? 0 }),
    } as unknown as RaidInfo;
    byDate.set(r.raid_date, [...(byDate.get(r.raid_date) ?? []), info]);
  }

  const raidTally = new Map<string, number>();
  let sessionCount = 0;
  for (const encounters of byDate.values()) {
    for (const s of groupSessions(encounters)) {
      sessionCount++;
      raidTally.set(s.short, (raidTally.get(s.short) ?? 0) + 1);
    }
  }

  const lastDate = [...byDate.keys()].sort().at(-1);
  let lastNight: AdminOverview["lastNight"] = null;
  if (lastDate) {
    const sessions = groupSessions(byDate.get(lastDate)!);
    lastNight = {
      date: lastDate,
      sessions: sessions.map((s) => {
        const runs = sessions.filter((x) => x.short === s.short).length;
        return {
          label: `${s.short} ${s.size}${runs > 1 ? ` · #${s.run}` : ""}`,
          short: s.short,
          size: s.size,
          run: s.run,
          runs,
          start: s.start,
          lastBoss: s.encounters.at(-1)?.boss_name ?? "",
          items: s.encounters.reduce((acc, e) => acc + (itemCount.get(e.id) ?? 0), 0),
        };
      }),
    };
  }

  // Ítems del catálogo sin regla de loteo, por raid.
  const withRule = new Set((rulesRes.data ?? []).map((r) => r.id_item).filter(Boolean));
  const missingByRaid = new Map<string, number>();
  for (const item of itemsRes.data ?? []) {
    if (!withRule.has(item.id_item))
      missingByRaid.set(item.raid, (missingByRaid.get(item.raid) ?? 0) + 1);
  }

  const staleFullGear = (fullGearRes.data ?? []).filter(
    (c) => now - new Date(c.updated_at ?? c.created_at).getTime() > 30 * DAY_MS,
  ).length;

  return {
    lastSync: lastUsed ? { at: lastUsed.last_used_at!, tokenName: lastUsed.name } : null,
    week: {
      sessions: sessionCount,
      byRaid: [...raidTally].map(([short, count]) => ({ short, count })),
      lootSync: syncCount.count ?? 0,
      lootManual: manualCount.count ?? 0,
    },
    lastNight,
    attention: {
      duplicates: dryRun?.deleted ?? 0,
      missing: dryRun?.inserted ?? 0,
      itemsWithoutRule: [...missingByRaid]
        .filter(([, count]) => count > 0)
        .map(([raid, count]) => ({ raid, count })),
      staleFullGear,
      idleTokens,
    },
  };
}

