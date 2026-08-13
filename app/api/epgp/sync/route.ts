import { NextResponse, after } from "next/server";
import { supabase } from "@/src/infrastructure/config/supabase";
import {
  EPGPLogEntry,
  generateLogId,
} from "@/src/infrastructure/services/epgpParser";
import { syncRaidItemsTask } from "@/src/infrastructure/services/syncRaidItems";

import { validateSyncRequest } from "@/src/infrastructure/utils/auth";
import { readSyncPayload } from "@/src/infrastructure/utils/syncBody";

export async function POST(request: Request) {
  try {
    const authError = validateSyncRequest(request);
    if (authError) return authError;

    const entries = await readSyncPayload<EPGPLogEntry[]>(request);
    if (!entries) {
      return NextResponse.json({ error: "Empty payload" }, { status: 400 });
    }
    if (entries.length === 0) {
      return NextResponse.json({
        message: "No entries found in payload",
        uploaded: 0,
      });
    }

    // Generate keys and handle same-file duplicates
    // (el filtro de ventana temporal ya lo aplicó el cliente vía LOGS_TIME_LIMIT_MONTHS)
    const allEntries = [];
    const seen = new Set();
    const fileOccurrenceCount = new Map();

    for (const entry of entries) {
      const baseHash = generateLogId(entry);
      const count = (fileOccurrenceCount.get(baseHash) || 0) + 1;
      fileOccurrenceCount.set(baseHash, count);

      const key = count === 1 ? baseHash : `${baseHash}_${count}`;

      if (!seen.has(key)) {
        seen.add(key);
        allEntries.push({ ...entry, key });
      }
    }

    if (allEntries.length === 0) {
      return NextResponse.json({
        message: "No valid recent entries found",
        uploaded: 0,
      });
    }

    // 5. Fetch existing keys from Supabase
    // To avoid fetching all keys, we can fetch only the keys present in the current batch
    const keysToCheck = allEntries.map((e) => e.key);

    // Supabase in(...) has a limit, so we chunk it if it's very large, but usually a batch is < 1000
    // We'll chunk the keys just in case. GET queries have URL length limits (around 16KB).
    const fetchChunkSize = 150; // Seguro para el límite de URL
    const insertChunkSize = 500;
    const existingKeysSet = new Set();

    for (let i = 0; i < keysToCheck.length; i += fetchChunkSize) {
      const chunk = keysToCheck.slice(i, i + fetchChunkSize);
      const { data, error } = await supabase
        .from("epgp_logs")
        .select("key")
        .in("key", chunk);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      data?.forEach((row) => existingKeysSet.add(row.key));
    }

    // 6. Filter new entries
    const newEntries = allEntries.filter((e) => !existingKeysSet.has(e.key));

    if (newEntries.length === 0) {
      return NextResponse.json({
        message: "All logs are already synchronized",
        uploaded: 0,
      });
    }

    // 7. Upload to Supabase
    const dataToUpload = newEntries.map(({ raw_timestamp, ...rest }) => rest);

    // Upsert or insert batch
    for (let i = 0; i < dataToUpload.length; i += insertChunkSize) {
      const chunk = dataToUpload.slice(i, i + insertChunkSize);
      const { error } = await supabase.from("epgp_logs").insert(chunk);

      if (error) {
        throw new Error(`Insert error: ${error.message}`);
      }
    }

    // Trigger Raid Items sync after the response is sent.
    // NOTE: a plain fire-and-forget call here gets killed by the serverless
    // runtime as soon as the response is returned, before the async task
    // (several sequential awaited Supabase calls) finishes. after() keeps
    // the function alive until the callback settles.
    after(() => syncRaidItemsTask().catch((e) => console.error(e)));

    return NextResponse.json({
      message: "Sync successful",
      uploaded: dataToUpload.length,
    });
  } catch (error: any) {
    console.error("EPGP Sync API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
