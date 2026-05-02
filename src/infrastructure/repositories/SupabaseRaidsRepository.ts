import { supabase } from "@/src/infrastructure/config/supabase";
import { IRaidsRepository } from "@/src/domain/repositories/IRaidsRepository";
import { RaidDateResult, RaidData } from "@/src/domain/entities/Raid";

export class SupabaseRaidsRepository implements IRaidsRepository {
  async getRaidsByDate(date: string): Promise<RaidDateResult> {
    const { data: raids, error: raidsError } = await supabase
      .from("raids")
      .select("*")
      .eq("raid_date", date)
      .order("raid_time", { ascending: true });

    if (raidsError) throw raidsError;

    if (!raids || raids.length === 0) {
      return { date, raids: [] };
    }

    const raidIds = raids.map((r) => r.id);
    const { data: participants, error: participantsError } = await supabase
      .from("raid_participants")
      .select("*")
      .in("raid_id", raidIds)
      .order("player_group", { ascending: true });

    if (participantsError) throw participantsError;

    const { data: raidItems, error: itemsError } = await supabase
      .from("raid_items")
      .select("*, items(*)")
      .in("id_raids", raidIds);

    if (itemsError) throw itemsError;

    const raidsWithParticipants = raids.map((raid) => ({
      ...raid,
      participants: (participants || []).filter((p) => p.raid_id === raid.id),
      items: (raidItems || []).filter((i) => i.id_raids === raid.id),
    }));

    return {
      date,
      raids: raidsWithParticipants as RaidData[],
    };
  }
}
