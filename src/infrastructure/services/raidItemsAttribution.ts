/**
 * Atribución de botín a encuentros de raid.
 *
 * La tabla `raids` guarda un registro por jefe matado (ICC tiene ~12 por
 * noche con los mismos 25 jugadores; RS puede tener varias kills de Halion
 * el mismo día con grupos distintos). Cada entrega de botín en EPGP debe
 * quedar ligada a UN solo encuentro: el último jefe matado antes de la
 * entrega en el que participaba el ganador. Antes se ligaba a todos los
 * encuentros del día donde el personaje aparecía, lo que copiaba cada ítem
 * en cada jefe.
 */

export interface AttributionRaid {
  id: string | number;
  raid_date: string; // YYYY-MM-DD (hora de Lima)
  raid_time: string; // HH:MM:SS fin del encuentro (hora de Lima)
  participants: { player_name: string; player_class: string | null }[];
}

export interface AttributionLog {
  fecha: string; // DD/MM/YYYY (hora de Lima)
  hour: string | null; // HH:MM:SS (hora de Lima)
  personaje: string;
  descripcion: string;
  valor: number;
}

export interface AttributedItem {
  id_item: number;
  id_raids: string | number;
  personaje: string;
  class: string | null;
  valor: number;
}

/** Margen por el redondeo a minutos de raid_time. */
const KILL_TOLERANCE_MS = 2 * 60 * 1000;
/** Un botín nunca se entrega más de este tiempo antes/después de un kill de la misma noche. */
const MAX_GAP_MS = 6 * 3600 * 1000;

const ITEM_ID = /\(ID:\s*(\d+)\)/i;
const UNDO = /undo|deshacer/i;

function toMs(isoDate: string, time: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const [h = 0, mi = 0, s = 0] = time.split(":").map(Number);
  return Date.UTC(y, m - 1, d, h, mi, s);
}

function logMs(log: AttributionLog) {
  const [d, m, y] = log.fecha.split("/");
  return toMs(`${y}-${m}-${d}`, log.hour || "23:59:59");
}

export function itemIdOf(descripcion: string) {
  const match = descripcion.match(ITEM_ID);
  return match ? parseInt(match[1], 10) : null;
}

/** Entrega anulada: el addon registra un Undo/Deshacer o devuelve los puntos (valor positivo). */
export function isCancellation(log: AttributionLog) {
  return UNDO.test(log.descripcion) || log.valor > 0;
}

/**
 * Devuelve las filas de raid_items que deberían existir para los encuentros
 * y logs dados (una por entrega de botín), sin duplicar entre jefes.
 */
export function attributeLoot(raids: AttributionRaid[], logs: AttributionLog[]): AttributedItem[] {
  const encounters = raids
    .map((r) => ({
      raid: r,
      at: toMs(r.raid_date, r.raid_time),
      players: new Map(r.participants.map((p) => [p.player_name, p.player_class])),
    }))
    .sort((a, b) => a.at - b.at);

  // Entregas anuladas (mismo criterio que el trigger handle_raid_item_substitution).
  const cancelled = new Set<string>();
  for (const log of logs) {
    const id = itemIdOf(log.descripcion);
    if (id != null && isCancellation(log)) cancelled.add(`${log.fecha}|${log.personaje}|${id}`);
  }

  const result: AttributedItem[] = [];
  const seen = new Set<string>();

  for (const log of logs) {
    const id_item = itemIdOf(log.descripcion);
    if (id_item == null || isCancellation(log)) continue;
    if (cancelled.has(`${log.fecha}|${log.personaje}|${id_item}`)) continue;

    const at = logMs(log);
    const candidates = encounters.filter(
      (e) => e.players.has(log.personaje) && Math.abs(at - e.at) <= MAX_GAP_MS,
    );
    if (candidates.length === 0) continue;

    // El último kill anterior a la entrega; si el reloj del log va por delante del kill, el más cercano.
    const before = candidates.filter((e) => e.at <= at + KILL_TOLERANCE_MS);
    const chosen =
      before.length > 0
        ? before[before.length - 1]
        : candidates.reduce((best, e) => (Math.abs(e.at - at) < Math.abs(best.at - at) ? e : best));

    const key = `${id_item}|${chosen.raid.id}|${log.personaje}`;
    if (seen.has(key)) continue;
    seen.add(key);

    result.push({
      id_item,
      id_raids: chosen.raid.id,
      personaje: log.personaje,
      class: chosen.players.get(log.personaje) ?? null,
      valor: log.valor,
    });
  }

  return result;
}

export interface ExistingRaidItem {
  id: number;
  id_item: number;
  id_raids: string | number;
  personaje: string;
  source: string | null;
}

/**
 * Filas del sync que sobran: copias de una entrega que ya quedó asignada a
 * otro encuentro del mismo día, o entregas anuladas en EPGP. Las filas sin
 * ningún log que las respalde se conservan (no hay con qué contrastarlas) y
 * los registros manuales nunca se tocan.
 */
export function rowsToPrune(
  existing: ExistingRaidItem[],
  desired: AttributedItem[],
  raids: Pick<AttributionRaid, "id" | "raid_date">[],
  logs: AttributionLog[],
): ExistingRaidItem[] {
  const dateOf = new Map(raids.map((r) => [String(r.id), r.raid_date]));
  const exact = new Set(desired.map((d) => `${d.id_item}|${d.id_raids}|${d.personaje}`));
  const assignedThatDay = new Set(
    desired.map((d) => `${dateOf.get(String(d.id_raids))}|${d.personaje}|${d.id_item}`),
  );
  const cancelled = new Set(
    logs
      .filter((l) => itemIdOf(l.descripcion) != null && isCancellation(l))
      .map(
        (l) =>
          `${l.fecha.split("/").reverse().join("-")}|${l.personaje}|${itemIdOf(l.descripcion)}`,
      ),
  );

  return existing.filter((e) => {
    if ((e.source ?? "sync") !== "sync") return false;
    if (exact.has(`${e.id_item}|${e.id_raids}|${e.personaje}`)) return false;
    const dayKey = `${dateOf.get(String(e.id_raids))}|${e.personaje}|${e.id_item}`;
    return assignedThatDay.has(dayKey) || cancelled.has(dayKey);
  });
}
