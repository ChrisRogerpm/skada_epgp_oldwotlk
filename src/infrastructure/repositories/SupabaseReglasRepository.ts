import { supabase } from "@/src/infrastructure/config/supabase";
import { getSupabaseAdmin } from "@/src/infrastructure/config/supabaseAdmin";
import { IReglasRepository } from "@/src/domain/repositories/IReglasRepository";
import {
  ReglaLoteoRow,
  ReglaPuntoRow,
  ReglaLoteoInput,
  ReglaLoteoRecord,
  ReglaPuntoInput,
  ReglaPuntoRecord,
  RAID_CODE_TO_LABEL,
  RAID_LABEL_TO_CODE,
} from "@/src/domain/entities/Reglas";

function mapLoteoRecord(row: any): ReglaLoteoRecord {
  return {
    id: row.id,
    raidCode: RAID_LABEL_TO_CODE[row.raid] || "ICC",
    categoria: row.categoria_item,
    nombreItem: row.nombre_item,
    requisitos: Array.isArray(row.requisitos) ? row.requisitos : row.requisitos ? [row.requisitos] : [],
    valorMinimo: row.valor_minimo,
    iconUrl: row.icon_url,
    idItem: row.id_item ?? null,
    updatedAt: row.updated_at,
  };
}

function mapPuntoRecord(row: any): ReglaPuntoRecord {
  return {
    id: row.id,
    tipo: row.tipo,
    categoria: row.categoria,
    descripcion: row.descripcion,
    valor: row.valor,
    iconUrl: row.icon_url,
    sortOrder: row.sort_order ?? 0,
    updatedAt: row.updated_at,
  };
}

export class SupabaseReglasRepository implements IReglasRepository {
  private get adminClient() {
    return getSupabaseAdmin();
  }

  async getLoteo(): Promise<ReglaLoteoRow[]> {
    const { data, error } = await supabase.from("reglas_loteo").select("*");

    if (error) {
      console.error("Error Loteo:", error);
      throw error;
    }
    return data || [];
  }

  async getPuntos(): Promise<ReglaPuntoRow[]> {
    const { data, error } = await supabase.from("reglas_puntos").select("*").order("sort_order", { ascending: true });

    if (error) {
      console.error("Error Puntos:", error);
      throw error;
    }
    return data || [];
  }

  // Ítem nuevo → al final de la lista (orden global, con huecos de 10 para
  // poder insertar entre dos filas más adelante sin renumerar todo).
  private async nextPuntoSortOrder(): Promise<number> {
    const { data, error } = await this.adminClient
      .from("reglas_puntos")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return (data?.sort_order ?? 0) + 10;
  }

  async createLoteo(input: ReglaLoteoInput): Promise<ReglaLoteoRecord> {
    const { data, error } = await this.adminClient
      .from("reglas_loteo")
      .insert([
        {
          raid: RAID_CODE_TO_LABEL[input.raidCode],
          categoria_item: input.categoria,
          nombre_item: input.nombreItem,
          requisitos: input.requisitos,
          valor_minimo: input.valorMinimo,
          icon_url: input.iconUrl,
          id_item: input.idItem,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return mapLoteoRecord(data);
  }

  async updateLoteo(id: string, input: ReglaLoteoInput): Promise<ReglaLoteoRecord> {
    const { data, error } = await this.adminClient
      .from("reglas_loteo")
      .update({
        raid: RAID_CODE_TO_LABEL[input.raidCode],
        categoria_item: input.categoria,
        nombre_item: input.nombreItem,
        requisitos: input.requisitos,
        valor_minimo: input.valorMinimo,
        icon_url: input.iconUrl,
        id_item: input.idItem,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return mapLoteoRecord(data);
  }

  async deleteLoteo(id: string): Promise<void> {
    const { error } = await this.adminClient.from("reglas_loteo").delete().eq("id", id);
    if (error) throw error;
  }

  async createPunto(input: ReglaPuntoInput): Promise<ReglaPuntoRecord> {
    const sortOrder = input.sortOrder ?? (await this.nextPuntoSortOrder());

    const { data, error } = await this.adminClient
      .from("reglas_puntos")
      .insert([
        {
          tipo: input.tipo,
          categoria: input.categoria,
          descripcion: input.descripcion,
          valor: input.valor,
          icon_url: input.iconUrl,
          sort_order: sortOrder,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return mapPuntoRecord(data);
  }

  async updatePunto(id: string, input: ReglaPuntoInput): Promise<ReglaPuntoRecord> {
    const payload: Record<string, unknown> = {
      tipo: input.tipo,
      categoria: input.categoria,
      descripcion: input.descripcion,
      valor: input.valor,
      icon_url: input.iconUrl,
      updated_at: new Date().toISOString(),
    };
    // sortOrder es opcional: los guardados normales de descripción/valor/ícono
    // no la mandan, y no queremos pisarla con 0 por accidente.
    if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder;

    const { data, error } = await this.adminClient
      .from("reglas_puntos")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return mapPuntoRecord(data);
  }

  async deletePunto(id: string): Promise<void> {
    const { error } = await this.adminClient.from("reglas_puntos").delete().eq("id", id);
    if (error) throw error;
  }
}
