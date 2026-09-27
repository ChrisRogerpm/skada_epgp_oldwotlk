import { NextResponse } from "next/server";
import { SupabaseReglasRepository } from "@/src/infrastructure/repositories/SupabaseReglasRepository";
import { validateSyncRequest } from "@/src/infrastructure/utils/auth";
import { toAddonRules } from "@/src/infrastructure/services/addonRules";

// Reglas de puntos para el addon EPGP (ep_reasons.lua), consumidas por la app de
// escritorio ScriptSkada. Usa el mismo token que los endpoints de sync, así el cliente
// ya no necesita credenciales de Supabase embebidas.
export async function GET(request: Request) {
  const authError = validateSyncRequest(request);
  if (authError) return authError;

  try {
    const rows = await new SupabaseReglasRepository().getPuntos();
    return NextResponse.json(toAddonRules(rows));
  } catch (error) {
    console.error("Error obteniendo reglas para el addon:", error);
    const message = error instanceof Error ? error.message : "Error de servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
