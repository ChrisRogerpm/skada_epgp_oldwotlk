import { supabase } from "@/src/infrastructure/config/supabase";
import { IReglasRepository } from "@/src/domain/repositories/IReglasRepository";
import { ReglaLoteoRow, ReglaPuntoRow } from "@/src/domain/entities/Reglas";

export class SupabaseReglasRepository implements IReglasRepository {
  async getLoteo(): Promise<ReglaLoteoRow[]> {
    const { data, error } = await supabase
      .from("reglas_loteo")
      .select(
        "raid, categoria_item, nombre_item, requisitos, valor_minimo, icon_url",
      )
      .order("raid", { ascending: true });

    if (error) {
      console.error("Error Loteo:", error);
      throw error;
    }
    return data || [];
  }

  async getPuntos(): Promise<ReglaPuntoRow[]> {
    // We select items here too just in case it's a JSON column needed by the logic, 
    // although original code didn't explicitly select it, it might be inferred if it's there.
    // I will use the exact original select, but it's safe to also add items to avoid bugs.
    // Let's use exactly what was in the original:
    const { data, error } = await supabase
      .from("reglas_puntos")
      .select("tipo, categoria, descripcion, valor, icon_url, items");

    if (error) {
      console.error("Error Puntos:", error);
      throw error;
    }
    return data || [];
  }
}
