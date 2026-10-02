import { getSupabaseAdmin } from "@/src/infrastructure/config/supabaseAdmin";
import {
  attributeLoot,
  rowsToPrune,
  type AttributionLog,
  type AttributionRaid,
} from "./raidItemsAttribution";

export interface SyncRaidItemsOptions {
  /** Días hacia atrás a revisar (incluye hoy). */
  lookbackDays?: number;
  /**
   * Borra las filas de origen 'sync' que sobran: copias de una misma entrega
   * en varios jefes (lo que dejaba la versión anterior en ICC) y entregas
   * anuladas. Las filas sin log que las respalde y los registros manuales
   * nunca se tocan.
   */
  prune?: boolean;
}

export interface SyncRaidItemsResult {
  inserted: number;
  deleted: number;
  skipped: number;
}

const PAGE_SIZE = 1000;
// Los filtros .in() viajan en la URL: con cientos de ids PostgREST responde
// "Bad Request", así que se consultan por bloques.
const IN_CHUNK = 100;

function chunks<T>(values: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < values.length; i += size) out.push(values.slice(i, i + size));
  return out;
}

/**
 * Recorre todas las páginas de una consulta (PostgREST corta en 1000 filas).
 * La consulta debe llevar un ORDER BY estable: sin él Postgres puede repetir
 * u omitir filas entre páginas.
 */
async function fetchAll<T>(
  query: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
) {
  const rows: T[] = [];
  for (let page = 0; ; page++) {
    const { data, error } = await query(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return rows;
}

export async function syncRaidItemsTask({
  lookbackDays = 7,
  prune = true,
}: SyncRaidItemsOptions = {}): Promise<SyncRaidItemsResult> {
  console.log(`🚀 Starting Background Sync: Raid Items (${lookbackDays} días)...`);
  const summary: SyncRaidItemsResult = { inserted: 0, deleted: 0, skipped: 0 };

  try {
    // Server-only trusted job (only reached from Bearer-authenticated sync
    // routes). Uses the service_role client to bypass RLS — the anon client
    // has no INSERT policy on raid_items and the insert was failing silently
    // under fire-and-forget.
    const supabase = getSupabaseAdmin();
    const today = new Date();
    const dates: string[] = [];
    for (let i = 0; i < lookbackDays; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }

    const raids: { id: string; raid_date: string; raid_time: string }[] = [];
    for (const dateChunk of chunks(dates, 31)) {
      raids.push(
        ...(await fetchAll<{ id: string; raid_date: string; raid_time: string }>((from, to) =>
          supabase
            .from("raids")
            .select("id, raid_date, raid_time")
            .in("raid_date", dateChunk)
            .order("id")
            .range(from, to),
        )),
      );
    }

    if (raids.length === 0) {
      console.log("ℹ️ Background Sync: No raids found in the window.");
      return summary;
    }

    const raidIds = raids.map((r) => r.id);

    // Participantes (una semana de ICC 25 ya son ~300 filas por noche).
    const participants: { raid_id: string; player_name: string; player_class: string | null }[] =
      [];
    for (const idChunk of chunks(raidIds, IN_CHUNK)) {
      participants.push(
        ...(await fetchAll<{ raid_id: string; player_name: string; player_class: string | null }>(
          (from, to) =>
            supabase
              .from("raid_participants")
              .select("raid_id, player_name, player_class")
              .in("raid_id", idChunk)
              .order("raid_id")
              .order("player_name")
              .range(from, to),
        )),
      );
    }

    const participantsByRaid = new Map<string, AttributionRaid["participants"]>();
    for (const p of participants) {
      if (!participantsByRaid.has(p.raid_id)) participantsByRaid.set(p.raid_id, []);
      participantsByRaid.get(p.raid_id)!.push(p);
    }

    const attributionRaids: AttributionRaid[] = raids.map((r) => ({
      ...r,
      participants: participantsByRaid.get(r.id) ?? [],
    }));

    // NOTE: PostgREST caps unpaginated selects at 1000 rows (its default
    // max-rows), silently truncating the rest instead of erroring. A 7-day
    // window of epgp_logs regularly exceeds that, so everything is paged.
    const formattedDates = dates.map((d) => {
      const [y, m, d_] = d.split("-");
      return `${d_}/${m}/${y}`;
    });
    const logs: AttributionLog[] = [];
    for (const dateChunk of chunks(formattedDates, 31)) {
      const page = await fetchAll<AttributionLog>((from, to) =>
        supabase
          .from("epgp_logs")
          .select("fecha, hour, personaje, descripcion, valor")
          .in("fecha", dateChunk)
          .like("descripcion", "%ID:%")
          .order("key")
          .range(from, to),
      );
      logs.push(...page.map((l) => ({ ...l, valor: Number(l.valor) })));
    }

    // Cada entrega de botín queda ligada a un único encuentro (ver raidItemsAttribution.ts).
    const desired = attributeLoot(attributionRaids, logs);
    const keyOf = (r: { id_item: number; id_raids: string | number; personaje: string }) =>
      `${r.id_item}|${r.id_raids}|${r.personaje}`;

    type ExistingRow = {
      id: number;
      id_item: number;
      id_raids: string;
      personaje: string;
      source: string | null;
    };
    const existing: ExistingRow[] = [];
    for (const idChunk of chunks(raidIds, IN_CHUNK)) {
      existing.push(
        ...(await fetchAll<ExistingRow>((from, to) =>
          supabase
            .from("raid_items")
            .select("id, id_item, id_raids, personaje, source")
            .in("id_raids", idChunk)
            .order("id")
            .range(from, to),
        )),
      );
    }
    const existingKeys = new Set(existing.map(keyOf));

    // 1) Primero se limpian las filas del sync que no corresponden, para que
    //    mover un ítem de un jefe a otro no choque con el índice único.
    if (prune) {
      const stale = rowsToPrune(existing, desired, raids, logs);
      for (const staleChunk of chunks(stale, IN_CHUNK)) {
        const ids = staleChunk.map((e) => e.id);
        const { error } = await supabase.from("raid_items").delete().in("id", ids);
        if (error) throw new Error(`Delete error: ${error.message}`);
      }
      summary.deleted = stale.length;
      if (stale.length)
        console.log(`   🧹 Background Sync: Removed ${stale.length} misattributed raid items.`);
    }

    // 2) Se insertan las que faltan.
    const toInsert = desired.filter((w) => !existingKeys.has(keyOf(w)));
    for (const batch of chunks(toInsert, 500)) {
      const { error } = await supabase.from("raid_items").insert(batch);
      if (!error) {
        summary.inserted += batch.length;
      } else {
        // Un conflicto con el índice único (p. ej. un registro manual del mismo
        // ítem en ese encuentro) no debe tumbar el lote entero: fila por fila.
        for (const row of batch) {
          const { error: rowErr } = await supabase.from("raid_items").insert(row);
          if (rowErr) {
            summary.skipped++;
            console.warn(`   ⚠️ Skipped raid item ${keyOf(row)}: ${rowErr.message}`);
          } else {
            summary.inserted++;
          }
        }
      }
    }

    console.log(
      `   ✅ Background Sync: ${summary.inserted} insertados, ${summary.deleted} eliminados, ${summary.skipped} omitidos.`,
    );
  } catch (error) {
    console.error("❌ Background Sync Error:", error instanceof Error ? error.message : error);
    throw error;
  }

  return summary;
}
