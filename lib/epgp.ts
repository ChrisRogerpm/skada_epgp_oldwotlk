/** Utilidades de historial EPGP (fechas dd/mm/yyyy + hh:mm:ss en hora de Lima). */

export interface EpgpMovement {
  personaje: string;
  descripcion: string;
  valor: number;
  fecha: string;
  hour: string;
}

export function movementTime(m: Pick<EpgpMovement, "fecha" | "hour">) {
  const [d, mo, y] = m.fecha.split("/").map(Number);
  const [h = 0, mi = 0, s = 0] = (m.hour || "").split(":").map(Number);
  return new Date(y, mo - 1, d, h, mi, s).getTime();
}

/**
 * Serie de puntos de los últimos `days` días reconstruida hacia atrás desde el
 * total actual (el historial guarda variaciones, no saldos).
 */
export function pointsSeries(history: EpgpMovement[], current: number, days: number, now: number) {
  const since = now - days * 24 * 3600 * 1000;
  const sorted = [...history].sort((a, b) => movementTime(a) - movementTime(b));
  const recent = sorted.filter((m) => movementTime(m) >= since);
  const recentSum = recent.reduce((s, m) => s + m.valor, 0);
  let pts = current - recentSum;
  const series = [{ t: since, pts }];
  recent.forEach((m) => {
    pts += m.valor;
    series.push({ t: movementTime(m), pts });
  });
  series.push({ t: now, pts: current });
  return series;
}

/** "Hoy 21:32" / "Ayer 23:10" / "29/09 22:15". */
export function relativeMovementLabel(t: number, now: number) {
  const d = new Date(t);
  const today = new Date(now);
  const hhmm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return `Hoy ${hhmm}`;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(d, yesterday)) return `Ayer ${hhmm}`;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} ${hhmm}`;
}
