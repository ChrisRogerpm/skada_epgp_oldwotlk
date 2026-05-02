import { supabase } from "@/src/infrastructure/config/supabase";
import { ILogsRepository } from "@/src/domain/repositories/ILogsRepository";
import { Log } from "@/src/domain/entities/Log";

export class SupabaseLogsRepository implements ILogsRepository {
  async getLogs(date: string | null, limit: number, offset: number): Promise<Log[]> {
    let queryBuilder = supabase.from("skada").select("*").range(offset, offset + limit - 1);

    if (date) {
      queryBuilder = queryBuilder.eq("date", date);
    }

    const { data, error } = await queryBuilder;

    if (error) throw error;
    if (!data) return [];

    return data.map((item: any) => ({
      name: item.name,
      date: item.date,
      Damage: item.data?.Damage || [],
      Healing: item.data?.Healing || [],
    }));
  }
}
