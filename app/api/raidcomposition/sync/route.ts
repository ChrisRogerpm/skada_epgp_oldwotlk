import { NextResponse, after } from 'next/server';
import { supabase } from '@/src/infrastructure/config/supabase';
import { syncRaidItemsTask } from '@/src/infrastructure/services/syncRaidItems';

const timeToSeconds = (timeStr: string) => {
  const [h, m, s] = timeStr.split(":").map(Number);
  return h * 3600 + m * 60 + (s || 0);
};

import { validateSyncRequest } from '@/src/infrastructure/utils/auth';
import { readSyncPayload } from '@/src/infrastructure/utils/syncBody';

interface RaidActorPayload {
  name: string;
  class: string;
  group: number;
}

interface RaidCompositionEncounterPayload {
  name: string;
  endtime: number;
  endtimeReal: string;
  peruDate: string;
  peruTime: string;
  actors: RaidActorPayload[];
}

export async function POST(request: Request) {
  try {
    const authError = validateSyncRequest(request);
    if (authError) return authError;

    const allEncounters = await readSyncPayload<RaidCompositionEncounterPayload[]>(request);
    if (!allEncounters) {
      return NextResponse.json({ error: 'Empty payload' }, { status: 400 });
    }

    if (allEncounters.length === 0) {
      return NextResponse.json({ message: 'No valid encounters found', uploaded: 0 });
    }

    const uniqueEncountersMap = new Map();
    const SESSION_GAP = 30 * 60; // 30 minutes in seconds

    for (const enc of allEncounters) {
      const key = `${enc.peruDate}|${enc.name}`;
      const existingSessions = uniqueEncountersMap.get(key) || [];
      
      const sessionIdx = existingSessions.findIndex(
        (s: any) => Math.abs(enc.endtime - s.endtime) < SESSION_GAP
      );

      if (sessionIdx !== -1) {
        if (enc.actors.length > existingSessions[sessionIdx].actors.length) {
          existingSessions[sessionIdx] = enc;
        } else if (enc.endtime > existingSessions[sessionIdx].endtime && enc.actors.length === existingSessions[sessionIdx].actors.length) {
          existingSessions[sessionIdx] = enc;
        }
      } else {
        existingSessions.push(enc);
      }
      uniqueEncountersMap.set(key, existingSessions);
    }

    const finalRaids = Array.from(uniqueEncountersMap.values()).flat();

    const uniqueDates = [...new Set(finalRaids.map((r: any) => r.peruDate))];
    const { data: existingRaids, error: raidsErr } = await supabase
      .from('raids')
      .select('id, raid_date, raid_time, boss_name')
      .in('raid_date', uniqueDates);

    if (raidsErr) throw new Error(`Fetch raids error: ${raidsErr.message}`);

    const existingByDate = new Map();
    for (const er of existingRaids || []) {
      if (!existingByDate.has(er.raid_date)) existingByDate.set(er.raid_date, []);
      existingByDate.get(er.raid_date).push(er);
    }

    const FUZZY_WINDOW = 15 * 60; // 15 minutes
    const toSync = [];

    for (const raid of finalRaids) {
      const raidsInDate = existingByDate.get(raid.peruDate) || [];
      const localSeconds = timeToSeconds(raid.peruTime);

      const isAlreadyRegistered = raidsInDate.some(
        (er: any) =>
          er.boss_name === raid.name &&
          Math.abs(timeToSeconds(er.raid_time) - localSeconds) < FUZZY_WINDOW
      );

      if (!isAlreadyRegistered) {
        toSync.push(raid);
      }
    }

    if (toSync.length === 0) {
      // Still trigger RaidItems background sync just in case
      after(() => syncRaidItemsTask().catch(e => console.error(e)));
      return NextResponse.json({ message: 'All compositions are up to date', uploaded: 0 });
    }

    let uploadedCount = 0;

    for (const raid of toSync) {
      const roundedTs = Math.round(raid.endtime / 60) * 60;
      // Recompute rounded format
      const d = new Date(roundedTs * 1000);
      d.setUTCHours(d.getUTCHours() - 5);
      const roundedTime = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')}`;
      const isoDate = raid.peruDate;
      const raidIdKey = `${isoDate}_${roundedTime.replace(/:/g, "-")}_${raid.name.replace(/\s+/g, "-")}`;

      // Upsert Raid
      const { data: raidUpsertData, error: upsertErr } = await supabase
        .from('raids')
        .upsert(
          {
            raid_id_key: raidIdKey,
            raid_date: isoDate,
            raid_time: roundedTime,
            boss_name: raid.name,
            raid_time_real: raid.endtimeReal,
          },
          { onConflict: 'raid_id_key' }
        )
        .select('id')
        .single();

      if (upsertErr) throw new Error(`Upsert error for ${raid.name}: ${upsertErr.message}`);

      const raidUuid = raidUpsertData.id;

      // Group Assignment
      const groupCounts: any = { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0 };
      for (const actor of raid.actors) {
        if (actor.group !== -1) groupCounts[actor.group]++;
      }

      const participantsData = raid.actors.map((actor: any) => {
        let finalGroup = actor.group;
        if (finalGroup === -1) {
          for (let g = 1; g <= 8; g++) {
            if (groupCounts[g] < 5) {
              finalGroup = g;
              groupCounts[g]++;
              break;
            }
          }
        }

        return {
          raid_id: raidUuid,
          player_name: actor.name,
          player_class: actor.class,
          player_group: finalGroup,
        };
      });

      // Insert participants chunked
      const chunkSize = 500;
      for (let i = 0; i < participantsData.length; i += chunkSize) {
        const chunk = participantsData.slice(i, i + chunkSize);
        const { error: partErr } = await supabase.from('raid_participants').insert(chunk);
        if (partErr) throw new Error(`Participants insert error: ${partErr.message}`);
      }
      
      uploadedCount++;
    }

    // Trigger Raid Items sync after the response is sent (see note in
    // app/api/epgp/sync/route.ts for why after() is required here).
    after(() => syncRaidItemsTask().catch(e => console.error(e)));

    return NextResponse.json({
      message: 'Composition sync successful',
      uploaded: uploadedCount
    });

  } catch (error: any) {
    console.error('Raid Composition Sync API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
