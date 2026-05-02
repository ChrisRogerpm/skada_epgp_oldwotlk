import { supabase } from "@/src/infrastructure/config/supabase";
import { IFullGearedRepository } from "@/src/domain/repositories/IFullGearedRepository";
import { FullGearedCharacter, PaginatedFullGearedResult } from "@/src/domain/entities/FullGeared";

export class SupabaseFullGearedRepository implements IFullGearedRepository {
  async getCharacters(page: number, limit: number, search: string): Promise<PaginatedFullGearedResult> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('full_geared_characters')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,main.ilike.%${search}%,class.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order('gs', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };
  }

  async createCharacter(character: Omit<FullGearedCharacter, "id" | "updated_at">): Promise<FullGearedCharacter> {
    const { data, error } = await supabase
      .from('full_geared_characters')
      .insert([character])
      .select();

    if (error) throw error;
    return data[0];
  }

  async updateCharacter(character: FullGearedCharacter): Promise<FullGearedCharacter> {
    const { id, ...updateData } = character;
    const { data, error } = await supabase
      .from('full_geared_characters')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  }

  async deleteCharacter(id: string | number): Promise<void> {
    const { error } = await supabase
      .from('full_geared_characters')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
