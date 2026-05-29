import { NextResponse } from 'next/server';
import { supabase } from '@/src/infrastructure/config/supabase';
import { parseRosterEntries, buildPrincipals } from '@/src/infrastructure/services/epgpParser';

import { validateSyncRequest } from '@/src/infrastructure/utils/auth';

export async function POST(request: Request) {
  try {
    const authError = validateSyncRequest(request);
    if (authError) return authError;

    const body = await request.text();
    if (!body || body.trim() === '') {
      return NextResponse.json({ error: 'Empty payload' }, { status: 400 });
    }

    // 1. Parse Data
    const entries = parseRosterEntries(body);
    const result = buildPrincipals(entries);

    if (result.length === 0) {
      return NextResponse.json({ message: 'No valid roster entries found in payload', uploaded: 0 });
    }

    // 2. Identify stale members
    const { data: existingData, error: fetchErr } = await supabase
      .from('epgp')
      .select('main');

    if (fetchErr) throw new Error(`DB Fetch Error: ${fetchErr.message}`);

    const existingMains = new Set((existingData || []).map(r => r.main));
    const newMains = new Set(result.map((entry: any) => entry.main));

    const mainsToDelete = [...existingMains].filter(main => !newMains.has(main));

    // 3. Delete stale members
    if (mainsToDelete.length > 0) {
      const chunkSize = 500;
      for (let i = 0; i < mainsToDelete.length; i += chunkSize) {
        const chunk = mainsToDelete.slice(i, i + chunkSize);
        const { error: deleteErr } = await supabase.from('epgp').delete().in('main', chunk);
        if (deleteErr) throw new Error(`Delete Error: ${deleteErr.message}`);
      }
    }

    // 4. Upsert active members
    const chunkSize = 500;
    for (let i = 0; i < result.length; i += chunkSize) {
      const chunk = result.slice(i, i + chunkSize);
      const { error: upsertErr } = await supabase.from('epgp').upsert(chunk, { onConflict: 'main' });
      if (upsertErr) throw new Error(`Upsert Error: ${upsertErr.message}`);
    }

    return NextResponse.json({
      message: 'Roster sync successful',
      uploaded: result.length,
      deleted: mainsToDelete.length
    });

  } catch (error: any) {
    console.error('EPGP Roster Sync API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
