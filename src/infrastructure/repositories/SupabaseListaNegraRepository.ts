import { supabase } from "@/src/infrastructure/config/supabase";
import { IListaNegraRepository } from "@/src/domain/repositories/IListaNegraRepository";
import { ListaNegraEntry } from "@/src/domain/entities/ListaNegra";

export class SupabaseListaNegraRepository implements IListaNegraRepository {
  async getEntries(): Promise<ListaNegraEntry[]> {
    const { data, error } = await supabase
      .from("lista_negra")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }
}
