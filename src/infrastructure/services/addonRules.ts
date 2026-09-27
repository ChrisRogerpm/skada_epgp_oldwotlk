import { ReglaPuntoRow } from "@/src/domain/entities/Reglas";

/** Formato que espera ScriptSkada para generar ep_reasons.lua. */
export interface AddonRule {
  categoria: string;
  description: string;
  value: number;
  tipo: string | null;
}

/**
 * reglas_puntos → reglas del addon. Conserva el orden recibido (sort_order, el que se
 * define a mano en el admin) y descarta filas sin descripción o sin valor numérico.
 */
export function toAddonRules(rows: ReglaPuntoRow[]): AddonRule[] {
  return rows
    .map((row) => ({
      categoria: String(row.categoria ?? "Otros").trim() || "Otros",
      description: String(row.descripcion ?? "").trim(),
      value: Number(row.valor),
      tipo: row.tipo ?? null,
    }))
    .filter((rule) => rule.description !== "" && Number.isFinite(rule.value));
}
