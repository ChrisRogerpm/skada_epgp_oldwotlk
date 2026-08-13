import { supabase } from "@/src/infrastructure/config/supabase";
import { getSupabaseAdmin } from "@/src/infrastructure/config/supabaseAdmin";
import { ILootRepository } from "@/src/domain/repositories/ILootRepository";
import {
  LootMatrix,
  LootWin,
  LootWinDetailed,
  PaginatedLootWinsResult,
  RaidOption,
  RegisterLootWinInput,
  UpdateLootWinInput,
} from "@/src/domain/entities/Loot";

function mapWinDetailed(row: any): LootWinDetailed {
  return {
    id: row.id,
    id_item: row.id_item,
    id_raids: row.id_raids,
    personaje: row.personaje,
    class: row.class,
    source: row.source ?? "sync",
    note: row.note ?? null,
    created_at: row.created_at,
    item_name: row.items?.name ?? "Ítem desconocido",
    item_icon: row.items?.icon ?? "",
    item_raid: row.items?.raid ?? "",
    raid_date: row.raids?.raid_date ?? "",
    boss_name: row.raids?.boss_name ?? "",
  };
}

export class SupabaseLootRepository implements ILootRepository {
  private get adminClient() {
    return getSupabaseAdmin();
  }

  async getLootMatrix(raid: string): Promise<LootMatrix> {
    const [{ data: items, error: itemsError }, { data: characters, error: charsError }] = await Promise.all([
      supabase.from("items").select("*").eq("raid", raid).order("name", { ascending: true }),
      supabase.from("epgp").select("main, class, icon, alters").order("main", { ascending: true }),
    ]);

    if (itemsError) throw itemsError;
    if (charsError) throw charsError;

    const itemIds = (items || []).map((i) => i.id_item);

    let wins: LootWin[] = [];
    if (itemIds.length > 0) {
      // select("*") a propósito: `source`/`created_by`/`created_at` sólo existen
      // una vez aplicada supabase_loot_audit_migration.sql. Pedirlas por nombre
      // rompería la matriz pública si la migración aún no corrió.
      const { data: winsData, error: winsError } = await supabase
        .from("raid_items")
        .select("*")
        .in("id_item", itemIds);

      if (winsError) throw winsError;
      wins = (winsData || []).map((row: any) => ({
        id: row.id,
        id_item: row.id_item,
        id_raids: row.id_raids,
        personaje: row.personaje,
        class: row.class,
        source: row.source ?? "sync",
        created_at: row.created_at,
      }));
    }

    return {
      raid,
      characters: (characters || []) as LootMatrix["characters"],
      items: (items || []) as LootMatrix["items"],
      wins,
    };
  }

  async getRaidOptions(limit: number, search: string): Promise<RaidOption[]> {
    let query = supabase
      .from("raids")
      .select("id, raid_date, raid_time, boss_name");

    if (search) {
      query = query.ilike("boss_name", `%${search}%`);
    }

    const { data, error } = await query
      .order("raid_date", { ascending: false })
      .order("raid_time", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as RaidOption[];
  }

  async getRecentWins(page: number, limit: number, search: string): Promise<PaginatedLootWinsResult> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.adminClient.from("raid_items").select("*, items(*), raids(*)", { count: "exact" });

    if (search) {
      query = query.ilike("personaje", `%${search}%`);
    }

    const { data, error, count } = await query.order("created_at", { ascending: false, nullsFirst: false }).range(from, to);

    if (error) throw error;

    return {
      data: (data || []).map(mapWinDetailed),
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  async getHistoryByCharacters(names: string[]): Promise<LootWinDetailed[]> {
    if (names.length === 0) return [];

    const { data, error } = await supabase
      .from("raid_items")
      .select("*, items(*), raids(*)")
      .in("personaje", names);

    if (error) throw error;

    return (data || [])
      .map(mapWinDetailed)
      .sort((a, b) => {
        if (a.raid_date !== b.raid_date) return a.raid_date < b.raid_date ? 1 : -1;
        return 0;
      });
  }

  async registerWin(input: RegisterLootWinInput, createdBy: string | null): Promise<LootWin> {
    const { data, error } = await this.adminClient
      .from("raid_items")
      .insert([
        {
          id_item: input.id_item,
          id_raids: input.id_raids ?? null,
          personaje: input.personaje,
          class: input.class ?? null,
          note: input.note ?? null,
          source: "manual",
          created_by: createdBy,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data as LootWin;
  }

  async registerWins(inputs: RegisterLootWinInput[], createdBy: string | null): Promise<LootWin[]> {
    // Un solo insert con varias filas: 1 round-trip sin importar cuántos
    // ítems se registren juntos (en vez de N llamadas a registerWin).
    const rows = inputs.map((input) => ({
      id_item: input.id_item,
      id_raids: input.id_raids ?? null,
      personaje: input.personaje,
      class: input.class ?? null,
      note: input.note ?? null,
      source: "manual",
      created_by: createdBy,
    }));

    const { data, error } = await this.adminClient.from("raid_items").insert(rows).select();

    if (error) throw error;
    return (data || []) as LootWin[];
  }

  async updateWin(input: UpdateLootWinInput): Promise<LootWin> {
    const { data, error } = await this.adminClient
      .from("raid_items")
      .update({
        id_item: input.id_item,
        id_raids: input.id_raids ?? null,
        personaje: input.personaje,
        class: input.class ?? null,
        note: input.note ?? null,
      })
      .eq("id", input.id)
      .select()
      .single();

    if (error) throw error;
    return data as LootWin;
  }

  async deleteWin(id: number): Promise<void> {
    const { error } = await this.adminClient.from("raid_items").delete().eq("id", id);
    if (error) throw error;
  }
}
