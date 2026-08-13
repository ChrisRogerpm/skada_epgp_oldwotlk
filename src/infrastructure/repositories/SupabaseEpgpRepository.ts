import { supabase } from '../config/supabase';
import { IEpgpRepository } from '../../domain/repositories/IEpgpRepository';
import { RosterMember, LogDetail } from '../../domain/entities/Epgp';

export class SupabaseEpgpRepository implements IEpgpRepository {
  
  async getEpgpRoster(): Promise<RosterMember[]> {
    const { data, error } = await supabase
      .from('epgp')
      .select('*');

    if (error) {
      console.error("Supabase error (getEpgpRoster):", error);
      throw new Error(`Error al obtener el roster: ${error.message}`);
    }

    return data as RosterMember[];
  }

  async getEpgpLogs(date: string): Promise<LogDetail[]> {
    const { data, error } = await supabase
      .from('epgp_logs')
      .select('*')
      .eq('fecha', date);

    if (error) {
      console.error("Supabase error (getEpgpLogs):", error);
      throw new Error(`Error al obtener logs para la fecha ${date}: ${error.message}`);
    }

    return data as LogDetail[];
  }

  async getEpgpHistoryByNames(names: string[]): Promise<LogDetail[]> {
    // NOTE: PostgREST caps unpaginated selects at 1000 rows (its default
    // max-rows) instead of erroring. A character's combined history (main +
    // alters) across months of raiding regularly exceeds that, so this must
    // be paged with .range() or the oldest entries silently disappear,
    // throwing off the accumulated EP chart and the events list.
    const allLogs: LogDetail[] = [];
    const pageSize = 1000;
    for (let page = 0; ; page++) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from("epgp_logs")
        .select("*")
        // `fecha` is stored as display text "DD/MM/YYYY", so ordering by it
        // sorts lexicographically (day digit first) instead of
        // chronologically — e.g. "31/05/2026" would rank above "12/08/2026"
        // even though August is far more recent. `fecha_date` holds the same
        // event date as a real ISO "YYYY-MM-DD" value, which sorts correctly.
        .in("personaje", names)
        .order("fecha_date", { ascending: false })
        .order("hour", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Supabase error (getEpgpHistoryByNames):", error);
        throw new Error(`Error al obtener historial para los personajes: ${error.message}`);
      }
      if (!data || data.length === 0) break;

      allLogs.push(...(data as LogDetail[]));
      if (data.length < pageSize) break;
    }

    return allLogs;
  }

  async searchCharacters(query: string): Promise<any[]> {
    const { data, error } = await supabase.rpc('search_characters', { 
      search_term: `%${query}%` 
    });

    if (error) {
      console.warn("RPC 'search_characters' not found or failed, falling back to manual search", error);
      
      const { data: epgpData, error: epgpError } = await supabase
        .from('epgp')
        .select('main, alters, class, icon');

      if (epgpError) {
        throw new Error(`Error en manual search fallback: ${epgpError.message}`);
      }

      const results: any[] = [];
      const searchTermLower = query.toLowerCase();

      epgpData.forEach((row: any) => {
        if (row.main.toLowerCase().includes(searchTermLower)) {
          results.push({
            main: row.main,
            nombre_alter: row.main,
            clase: row.class || "Unknown",
            url_icono: row.icon || ""
          });
        }

        if (row.alters && Array.isArray(row.alters)) {
          row.alters.forEach((alt: any) => {
            if (alt.name && alt.name.toLowerCase().includes(searchTermLower)) {
              results.push({
                main: row.main,
                nombre_alter: alt.name,
                clase: alt.class || "Unknown",
                url_icono: alt.icon || ""
              });
            }
          });
        }
      });

      const uniqueResults = results.filter((v, i, a) => 
        a.findIndex(t => (t.nombre_alter === v.nombre_alter)) === i
      );
      
      return uniqueResults.slice(0, 10);
    }

    return data || [];
  }
}
