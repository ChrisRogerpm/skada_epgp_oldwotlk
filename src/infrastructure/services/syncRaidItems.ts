import { getSupabaseAdmin } from '@/src/infrastructure/config/supabaseAdmin';

export async function syncRaidItemsTask() {
  console.log("🚀 Starting Background Sync: Raid Items...");

  try {
    // Server-only trusted job (only reached from Bearer-authenticated sync
    // routes). Uses the service_role client to bypass RLS — the anon client
    // has no INSERT policy on raid_items and the insert was failing silently
    // under fire-and-forget.
    const supabase = getSupabaseAdmin();
    const LOOKBACK_DAYS = 7;
    const today = new Date();
    const dates = [];
    for (let i = 0; i < LOOKBACK_DAYS; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }

    // Get raids from last 7 days
    const { data: existingRaids, error: raidsErr } = await supabase
      .from('raids')
      .select('id, raid_date, raid_time')
      .in('raid_date', dates);

    if (raidsErr) throw new Error(`Raids fetch error: ${raidsErr.message}`);
    if (!existingRaids || existingRaids.length === 0) {
      console.log("ℹ️ Background Sync: No raids found in the last 7 days.");
      return;
    }

    existingRaids.sort((a, b) => a.raid_time.localeCompare(b.raid_time));
    const raidIds = existingRaids.map((r) => r.id);

    // Get participants
    const { data: allParticipants, error: partErr } = await supabase
      .from('raid_participants')
      .select('raid_id, player_name, player_class')
      .in('raid_id', raidIds);

    if (partErr) throw new Error(`Participants fetch error: ${partErr.message}`);

    const participantsByRaid = new Map();
    const allUniqueCharacters = new Set<string>();
    
    for (const p of allParticipants || []) {
      if (!participantsByRaid.has(p.raid_id)) participantsByRaid.set(p.raid_id, []);
      participantsByRaid.get(p.raid_id).push(p);
      allUniqueCharacters.add(p.player_name);
    }

    const raidData = existingRaids.map((raid) => {
      const raidParticipants = participantsByRaid.get(raid.id) || [];
      const [year, month, day] = raid.raid_date.split("-");
      return {
        ...raid,
        fechaFormateada: `${day}/${month}/${year}`,
        participants: raidParticipants,
        participantNames: new Set(raidParticipants.map((p: any) => p.player_name)),
      };
    });

    // Get EPGP Logs
    const formattedDates = dates.map(d => {
      const [y, m, d_] = d.split("-");
      return `${d_}/${m}/${y}`;
    });

    // Supabase has a limit on .in() array size. But unique characters could be hundreds.
    // It's safer to fetch logs by date and filter characters in memory if there are too many.
    //
    // NOTE: PostgREST caps unpaginated selects at 1000 rows (its default
    // max-rows), silently truncating the rest instead of erroring. A 7-day
    // window of epgp_logs regularly exceeds that (e.g. one busy raid night
    // alone can be 700+ rows), so this must be paged with .range() or recent
    // entries randomly get cut and their items never reach raid_items.
    const allLogs: { fecha: string; personaje: string; descripcion: string }[] = [];
    const logsPageSize = 1000;
    for (let page = 0; ; page++) {
      const from = page * logsPageSize;
      const to = from + logsPageSize - 1;
      const { data: logsPage, error: logsErr } = await supabase
        .from('epgp_logs')
        .select('fecha, personaje, descripcion')
        .in('fecha', formattedDates)
        .range(from, to);

      if (logsErr) throw new Error(`Logs fetch error: ${logsErr.message}`);
      if (!logsPage || logsPage.length === 0) break;

      allLogs.push(...logsPage);
      if (logsPage.length < logsPageSize) break;
    }

    const validWinners: any[] = [];
    const processedKeys = new Set();

    for (const raid of raidData) {
      const raidLogs = (allLogs || []).filter(
        (log) => log.fecha === raid.fechaFormateada && raid.participantNames.has(log.personaje)
      );

      for (const log of raidLogs) {
        const itemIdMatch = log.descripcion.match(/ID:(\d+)/);
        if (!itemIdMatch) continue;

        const id_item = parseInt(itemIdMatch[1], 10);
        const compositeKey = `${id_item}|${raid.id}|${log.personaje}`;

        if (!processedKeys.has(compositeKey)) {
          processedKeys.add(compositeKey);
          const participant = raid.participants.find((p: any) => p.player_name === log.personaje);
          
          validWinners.push({
            id_item,
            id_raids: raid.id,
            personaje: log.personaje,
            class: participant ? participant.player_class : null,
          });
        }
      }
    }

    if (validWinners.length === 0) {
      console.log("   ✅ Background Sync: No new item drops detected in EPGP logs.");
      return;
    }

    // Filter against existing DB records
    const { data: existingItems, error: itemsErr } = await supabase
      .from('raid_items')
      .select('id_item, id_raids, personaje')
      .in('id_raids', raidIds);

    if (itemsErr) throw new Error(`Raid Items fetch error: ${itemsErr.message}`);

    const existingKeys = new Set(
      (existingItems || []).map((e) => `${e.id_item}|${e.id_raids}|${e.personaje}`)
    );

    const toInsert = validWinners.filter(
      (w) => !existingKeys.has(`${w.id_item}|${w.id_raids}|${w.personaje}`)
    );

    if (toInsert.length > 0) {
      const { error: insertErr } = await supabase.from('raid_items').insert(toInsert);
      if (insertErr) throw new Error(`Insert error: ${insertErr.message}`);
      console.log(`   📤 Background Sync: Synchronized ${toInsert.length} new raid items.`);
    } else {
      console.log("   ✅ Background Sync: All detected items are already registered.");
    }

  } catch (error: any) {
    console.error("❌ Background Sync Error:", error.message);
  }
}
