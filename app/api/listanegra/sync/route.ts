import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/src/infrastructure/config/supabase';

import { validateSyncRequest } from '@/src/infrastructure/utils/auth';
import { readSyncPayload } from '@/src/infrastructure/utils/syncBody';

interface IgnoreEntryPayload {
  name: string;
  reason: string | null;
}

const generateIgnoreId = (playerName: string) => {
  const key = playerName.toLowerCase();
  return crypto.createHash("md5").update(key).digest("hex");
};

export async function POST(request: Request) {
  try {
    const authError = validateSyncRequest(request);
    if (authError) return authError;

    const officerName = request.headers.get('x-officer-name');
    if (!officerName) {
      return NextResponse.json({ error: 'Missing x-officer-name header' }, { status: 400 });
    }

    const entries = await readSyncPayload<IgnoreEntryPayload[]>(request);
    if (!entries) {
      return NextResponse.json({ error: 'Empty payload' }, { status: 400 });
    }

    const localEntriesMap = new Map();

    for (const entry of entries) {
      const key = generateIgnoreId(entry.name);
      if (!localEntriesMap.has(key)) {
        localEntriesMap.set(key, {
          key,
          nombre: entry.name,
          reason: entry.reason || "Sin motivo",
          oficial: officerName
        });
      }
    }

    // Fetch all existing records from Supabase
    const { data: allExistingData, error: fetchError } = await supabase
      .from('lista_negra')
      .select('key, oficial');

    if (fetchError) {
      throw new Error(`DB Fetch Error: ${fetchError.message}`);
    }

    const existingKeysSet = new Set(allExistingData?.map(r => r.key) || []);
    
    // Find what to insert
    const toInsert = [];
    for (const [key, entry] of localEntriesMap) {
      if (!existingKeysSet.has(key)) {
        toInsert.push(entry);
      }
    }

    // Find what to delete (belongs to this officer, but not in their current file)
    const toDeleteKeys = [];
    for (const row of allExistingData || []) {
      if (row.oficial === officerName) {
        if (!localEntriesMap.has(row.key)) {
          toDeleteKeys.push(row.key);
        }
      }
    }

    // Perform DB Operations
    if (toInsert.length > 0) {
      const { error: insertError } = await supabase.from('lista_negra').insert(toInsert);
      if (insertError) throw new Error(`Insert Error: ${insertError.message}`);
    }

    if (toDeleteKeys.length > 0) {
      // Chunk deletions if too many
      const chunkSize = 500;
      for (let i = 0; i < toDeleteKeys.length; i += chunkSize) {
        const chunk = toDeleteKeys.slice(i, i + chunkSize);
        const { error: deleteError } = await supabase.from('lista_negra').delete().in('key', chunk);
        if (deleteError) throw new Error(`Delete Error: ${deleteError.message}`);
      }
    }

    return NextResponse.json({
      message: 'Sync successful',
      inserted: toInsert.length,
      deleted: toDeleteKeys.length
    });

  } catch (error: any) {
    console.error('Lista Negra Sync API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
