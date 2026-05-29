import { NextResponse } from "next/server";
import { supabase } from "@/src/infrastructure/config/supabase";
import {
  parseSkadaText,
  generateSkadaEncounterId,
} from "@/src/infrastructure/services/skadaParser";

import { validateSyncRequest } from '@/src/infrastructure/utils/auth';

export async function POST(request: Request) {
  try {
    const authError = validateSyncRequest(request);
    if (authError) return authError;

    // 2. Get Lua block text from body
    const body = await request.text();
    if (!body || body.trim() === "") {
      return NextResponse.json({ error: "Empty payload" }, { status: 400 });
    }

    // 3. Parse encounters
    const encounters = parseSkadaText(body);
    if (encounters.length === 0) {
      return NextResponse.json({
        message: "No relevant encounters found in payload",
        uploaded: 0,
      });
    }

    // 4. Map to SQL structure and generate keys
    const allParsed = [];
    for (const encounter of encounters) {
      const keyHash = generateSkadaEncounterId(encounter);
      const { date: encDate, name, ...rest } = encounter;

      allParsed.push({
        key: keyHash,
        date: encDate,
        name,
        data: rest,
      });
    }

    // 5. Fetch existing keys from Supabase
    const keysToCheck = allParsed.map((e) => e.key);
    const existingKeysSet = new Set();
    const chunkSize = 500;

    for (let i = 0; i < keysToCheck.length; i += chunkSize) {
      const chunk = keysToCheck.slice(i, i + chunkSize);
      const { data, error } = await supabase
        .from("skada")
        .select("key")
        .in("key", chunk);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      data?.forEach((row) => existingKeysSet.add(row.key));
    }

    // 6. Filter new encounters
    const newEncounters = allParsed.filter((e) => !existingKeysSet.has(e.key));

    if (newEncounters.length === 0) {
      return NextResponse.json({
        message: "All encounters are already synchronized",
        uploaded: 0,
      });
    }

    // Sort by date (oldest first)
    newEncounters.sort((a, b) => a.date.localeCompare(b.date));

    // 7. Upload to Supabase
    for (let i = 0; i < newEncounters.length; i += chunkSize) {
      const chunk = newEncounters.slice(i, i + chunkSize);
      const { error } = await supabase.from("skada").insert(chunk);

      if (error) {
        throw new Error(`Insert error: ${error.message}`);
      }
    }

    return NextResponse.json({
      message: "Sync successful",
      uploaded: newEncounters.length,
    });
  } catch (error: any) {
    console.error("Skada Sync API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
