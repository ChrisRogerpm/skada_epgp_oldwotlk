import { supabase } from "@/src/infrastructure/config/supabase";
import { IReglasRepository } from "@/src/domain/repositories/IReglasRepository";
import { ReglaLoteoRow, ReglaPuntoRow } from "@/src/domain/entities/Reglas";

export class SupabaseReglasRepository implements IReglasRepository {
  async getLoteo(): Promise<ReglaLoteoRow[]> {
    const { data, error } = await supabase
      .from("reglas_loteo")
      .select("*");

    if (error) {
      console.error("Error Loteo:", error);
      throw error;
    }
    return data || [];
  }

  async getPuntos(): Promise<ReglaPuntoRow[]> {
    const { data, error } = await supabase
      .from("reglas_puntos")
      .select("*");

    if (error) {
      console.error("Error Puntos:", error);
      throw error;
    }
    return data || [];
  }
}
