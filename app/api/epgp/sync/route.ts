import { NextResponse } from "next/server";
import { supabase } from "@/src/infrastructure/config/supabase";
import {
  parseLogEntries,
  generateLogId,
} from "@/src/infrastructure/services/epgpParser";
import { syncRaidItemsTask } from "@/src/infrastructure/services/syncRaidItems";

import { validateSyncRequest } from "@/src/infrastructure/utils/auth";

export async function POST(request: Request) {
  try {
    const authError = validateSyncRequest(request);
    if (authError) return authError;

    // 2. Get Lua block text from body
    const body = await request.text();
    if (!body || body.trim() === "") {
      return NextResponse.json({ error: "Empty payload" }, { status: 400 });
    }

    // 3. Parse entries
    const entries = parseLogEntries(body);
    if (entries.length === 0) {
      return NextResponse.json({
        message: "No entries found in payload",
        uploaded: 0,
      });
    }

    // 4. Generate keys and handle same-file duplicates
    const allEntries = [];
    const seen = new Set();
    const fileOccurrenceCount = new Map();

    // Time limit: last X months (optional, hardcoded to 6 for example, or removed if handled by client)
    const timeLimit = new Date();
    timeLimit.setMonth(timeLimit.getMonth() - 6);
    const timeLimitTs = timeLimit.getTime();

    const parseToTs = (e: any) => {
      const [dd, mm, yyyy] = e.fecha.split("/");
      return new Date(`${yyyy}-${mm}-${dd}T${e.hour}`).getTime();
    };

    for (const entry of entries) {
      // Filtro de 6 meses
      if (parseToTs(entry) < timeLimitTs) continue;

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

    // Trigger Raid Items sync asynchronously
    syncRaidItemsTask().catch((e) => console.error(e));

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
