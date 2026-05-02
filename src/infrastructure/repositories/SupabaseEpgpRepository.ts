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
    const { data, error } = await supabase
      .from("epgp_logs")
      .select("*")
      .in("personaje", names)
      .order("fecha", { ascending: false })
      .order("hour", { ascending: false });

    if (error) {
      console.error("Supabase error (getEpgpHistoryByNames):", error);
      throw new Error(`Error al obtener historial para los personajes: ${error.message}`);
    }

    return data as LogDetail[];
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
