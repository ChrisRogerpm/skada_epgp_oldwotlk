import { NextResponse } from "next/server";
import { supabase } from "@/src/infrastructure/config/supabase";
import {
  buildSkadaEncounterRecord,
  generateSkadaEncounterId,
  SkadaEncounterPayload,
} from "@/src/infrastructure/services/skadaParser";

import { validateSyncRequest } from '@/src/infrastructure/utils/auth';
import { readSyncPayload } from '@/src/infrastructure/utils/syncBody';

export async function POST(request: Request) {
  try {
    const authError = validateSyncRequest(request);
    if (authError) return authError;

    const payload = await readSyncPayload<SkadaEncounterPayload[]>(request);
    if (!payload) {
      return NextResponse.json({ error: "Empty payload" }, { status: 400 });
    }

    // Reconstruir Damage/Healing (ranking, talento, ícono, formateo) a partir de los participantes crudos
    const encounters = payload.map(buildSkadaEncounterRecord);
    if (encounters.length === 0) {
      return NextResponse.json({
        message: "No relevant encounters found in payload",
        uploaded: 0,
      });
    }

    // 4. Map to SQL structure and generate keys.
    // La key incluye el endtime, así que dos sesiones del mismo jefe/dificultad el mismo
    // día quedan con keys distintas (filas separadas) en vez de colisionar.
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

    // Descartar duplicados dentro del mismo payload (misma key)
    const dedupedParsed = [...new Map(allParsed.map((e) => [e.key, e])).values()];

    // 5. Detectar qué ya está sincronizado comparando date+name+difficulty+endtime reales
    // contra las filas existentes (no solo por key: el histórico previo a este cambio
    // se guardó con una key que no incluía el endtime, así que comparar por key a secas
    // podría bloquear una sesión nueva y distinta que cae el mismo día).
    const uniqueDates = [...new Set(dedupedParsed.map((e) => e.date))];
    const existingSignatures = new Set<string>();
    const chunkSize = 500;

    for (let i = 0; i < uniqueDates.length; i += chunkSize) {
      const chunk = uniqueDates.slice(i, i + chunkSize);
      const { data, error } = await supabase
        .from("skada")
        .select("date, name, data")
        .in("date", chunk);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      data?.forEach((row: any) => {
        const signature = `${row.date}|${row.name}|${row.data?.difficulty || 0}|${row.data?.endtime}`;
        existingSignatures.add(signature);
      });
    }

    // 6. Filter new encounters
    const newEncounters = dedupedParsed.filter((e) => {
      const signature = `${e.date}|${e.name}|${e.data.difficulty || 0}|${e.data.endtime}`;
      return !existingSignatures.has(signature);
    });

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
