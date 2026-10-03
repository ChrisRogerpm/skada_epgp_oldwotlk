import { getSupabaseAdmin } from "@/src/infrastructure/config/supabaseAdmin";
import type { RaidInfo } from "@/app/types/RaidComposition";
import { groupSessions, raidShort } from "@/lib/raids";
import { limaIsoDate } from "@/lib/wow";

export interface AutoLinkedEncounter {
  id: string;
  boss_name: string;
  raid_date: string;
  raid_time: string;
  /** "RS 25 · #4", o "ICC 25" cuando solo hubo una run de esa instancia ese día. */
  sessionLabel: string;
}

/** Una entrega manual se vincula a un kill de como mucho estas horas atrás. */
const MAX_AGE_MS = 8 * 3600 * 1000;
/** Perú no usa horario de verano: hora de Lima = UTC−5. */
const LIMA_OFFSET_H = 5;

function encounterMs(date: string, time: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [h = 0, mi = 0, s = 0] = time.split(":").map(Number);
  return Date.UTC(y, m - 1, d, h + LIMA_OFFSET_H, mi, s);
}

/**
 * Último encuentro de la instancia `raidCode` (ICC, RS, TOGC) en el que
 * participó `personaje` durante las últimas horas, para que el botín
 * registrado a mano quede ligado a su raid (y el sync no lo duplique).
 */
export async function findRecentEncounter(
  personaje: string,
  raidCode: string,
  now = Date.now(),
): Promise<AutoLinkedEncounter | null> {
  if (!personaje || !raidCode) return null;
  const supabase = getSupabaseAdmin();
  const days = [limaIsoDate(new Date(now)), limaIsoDate(new Date(now - 24 * 3600 * 1000))];

  const { data: raids, error } = await supabase
    .from("raids")
    .select("id, raid_id_key, raid_date, raid_time, boss_name, created_at")
    .in("raid_date", days);
  if (error) throw new Error(error.message);

  const code = raidCode.toUpperCase();
  const candidates = (raids ?? []).filter(
    (r) =>
      raidShort(r.boss_name).toUpperCase() === code &&
      now - encounterMs(r.raid_date, r.raid_time) <= MAX_AGE_MS &&
      encounterMs(r.raid_date, r.raid_time) <= now + 5 * 60 * 1000,
  );
  if (!candidates.length) return null;

  const { data: participants, error: partError } = await supabase
    .from("raid_participants")
    .select("raid_id, player_name")
    .in(
      "raid_id",
      (raids ?? []).map((r) => r.id),
    )
    .limit(5000);
  if (partError) throw new Error(partError.message);

  const target = personaje.toLowerCase();
  const joined = new Set(
    (participants ?? [])
      .filter((p) => p.player_name?.toLowerCase() === target)
      .map((p) => p.raid_id),
  );
  const chosen = candidates
    .filter((r) => joined.has(r.id))
    .sort(
      (a, b) => encounterMs(b.raid_date, b.raid_time) - encounterMs(a.raid_date, a.raid_time),
    )[0];
  if (!chosen) return null;

  // Etiqueta de la run, con el mismo agrupado que la página de Raids.
  const countByRaid = new Map<string, number>();
  for (const p of participants ?? [])
    countByRaid.set(p.raid_id, (countByRaid.get(p.raid_id) ?? 0) + 1);
  const sameDay = (raids ?? [])
    .filter((r) => r.raid_date === chosen.raid_date)
    .map(
      (r) =>
        ({
          ...r,
          participants: Array.from({ length: countByRaid.get(r.id) ?? 0 }),
        }) as unknown as RaidInfo,
    );
  const sessions = groupSessions(sameDay);
  const session = sessions.find((s) => s.encounters.some((e) => e.id === chosen.id));
  const runs = session ? sessions.filter((s) => s.short === session.short).length : 1;
  const sessionLabel = session
    ? `${session.short} ${session.size}${runs > 1 ? ` · #${session.run}` : ""}`
    : raidShort(chosen.boss_name);

  return {
    id: chosen.id,
    boss_name: chosen.boss_name,
    raid_date: chosen.raid_date,
    raid_time: chosen.raid_time,
    sessionLabel,
  };
}
