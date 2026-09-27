import { ReglaLoteoRow, ReglaPuntoRow } from "@/src/domain/entities/Reglas";

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
function puntosToAddonRules(rows: ReglaPuntoRow[]): AddonRule[] {
  return rows
    .map((row) => ({
      categoria: String(row.categoria ?? "Otros").trim() || "Otros",
      description: String(row.descripcion ?? "").trim(),
      value: Number(row.valor),
      tipo: row.tipo ?? null,
    }))
    .filter((rule) => rule.description !== "" && Number.isFinite(rule.value));
}

/**
 * reglas_loteo → reglas del addon, con el formato histórico de ep_reasons.lua:
 *   "Icecrown Citadel (ICC) - Anillo de rápido ascenso (50664)"  value = -100
 * El addon reconoce el "(<id>)" final: muestra el ícono del ítem y, al asignarlo, lo
 * registra en el log como "... (ID:<id>)", que es lo que cruzan los triggers de raid_items.
 * El valor es el mínimo de la puja, en negativo (el ganador pierde EP).
 */
function loteoToAddonRules(rows: ReglaLoteoRow[]): AddonRule[] {
  return rows
    .map((row) => {
      const raid = String(row.raid ?? "").trim() || "Otros";
      const name = String(row.nombre_item ?? "").trim();
      const id = row.id_item ? ` (${row.id_item})` : "";
      // Number(null) y Number("") dan 0: un ítem sin valor mínimo no debe entrar como "-0".
      const min =
        row.valor_minimo == null || row.valor_minimo === "" ? NaN : Number(row.valor_minimo);
      return {
        categoria: raid,
        description: name ? `${raid} - ${name}${id}` : "",
        value: -Math.abs(min),
        tipo: "loteo",
      };
    })
    .filter((rule) => rule.description !== "" && Number.isFinite(rule.value))
    .sort((a, b) => a.description.localeCompare(b.description, "es"));
}

/**
 * Lista completa para el addon: primero las reglas de puntos (orden del admin) y luego los
 * ítems de loteo (alfabético). El cliente agrupa por categoría con un orden estable, así que
 * dentro de cada raid quedan las reglas y después sus ítems, como en el ep_reasons.lua anterior.
 * Si una descripción se repite, se conserva la primera.
 */
export function toAddonRules(puntos: ReglaPuntoRow[], loteo: ReglaLoteoRow[] = []): AddonRule[] {
  const seen = new Set<string>();
  return [...puntosToAddonRules(puntos), ...loteoToAddonRules(loteo)].filter((rule) => {
    if (seen.has(rule.description)) return false;
    seen.add(rule.description);
    return true;
  });
}
