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
    const { data, error } = await supabase.from("reglas_puntos").select("*");

    if (error) {
      console.error("Error Puntos:", error);
      throw error;
    }
    return data || [];
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
    const { data, error } = await this.adminClient
      .from("reglas_puntos")
      .insert([
        {
          tipo: input.tipo,
          categoria: input.categoria,
          descripcion: input.descripcion,
          valor: input.valor,
          icon_url: input.iconUrl,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return mapPuntoRecord(data);
  }

  async updatePunto(id: string, input: ReglaPuntoInput): Promise<ReglaPuntoRecord> {
    const { data, error } = await this.adminClient
      .from("reglas_puntos")
      .update({
        tipo: input.tipo,
        categoria: input.categoria,
        descripcion: input.descripcion,
        valor: input.valor,
        icon_url: input.iconUrl,
        updated_at: new Date().toISOString(),
      })
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
