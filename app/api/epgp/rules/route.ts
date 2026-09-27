import { NextResponse } from "next/server";
import { SupabaseReglasRepository } from "@/src/infrastructure/repositories/SupabaseReglasRepository";
import { validateSyncRequest } from "@/src/infrastructure/utils/auth";
import { toAddonRules } from "@/src/infrastructure/services/addonRules";

// Reglas para el addon EPGP (ep_reasons.lua), consumidas por la app de escritorio
// ScriptSkada: reglas de puntos (beneficios/perjuicios) + ítems de loteo. Usa el mismo
// token que los endpoints de sync, así el cliente no necesita credenciales de Supabase.
export async function GET(request: Request) {
  const authError = validateSyncRequest(request);
  if (authError) return authError;

  try {
    const repository = new SupabaseReglasRepository();
    const [puntos, loteo] = await Promise.all([repository.getPuntos(), repository.getLoteo()]);
    return NextResponse.json(toAddonRules(puntos, loteo));
  } catch (error) {
    console.error("Error obteniendo reglas para el addon:", error);
    const message = error instanceof Error ? error.message : "Error de servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
