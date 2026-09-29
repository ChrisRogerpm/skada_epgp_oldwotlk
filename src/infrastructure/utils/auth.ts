import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/src/infrastructure/config/supabaseAdmin";

type SyncApiToken = {
  id: string;
  officer_name: string | null;
  scopes: string[];
  expires_at: string | null;
  revoked_at: string | null;
  last_used_at: string | null;
};

const LAST_USED_UPDATE_INTERVAL_MS = 5 * 60 * 1000;

export function hashSyncToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function safeTokenEquals(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  return (
    actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export function isSyncTokenUsable(
  token: SyncApiToken,
  requiredScope: string,
  officerName: string | null,
  now = new Date(),
): boolean {
  if (token.revoked_at) return false;
  if (token.expires_at && new Date(token.expires_at) <= now) return false;
  if (!token.scopes.includes("*") && !token.scopes.includes(requiredScope)) {
    return false;
  }

  if (token.officer_name) {
    if (!officerName) return false;
    if (token.officer_name.trim().toLocaleLowerCase() !== officerName.trim().toLocaleLowerCase()) {
      return false;
    }
  }

  return true;
}

async function validateStoredToken(
  rawToken: string,
  requiredScope: string,
  officerName: string | null,
): Promise<boolean> {
  const supabaseAdmin = getSupabaseAdmin();
  const tokenHash = hashSyncToken(rawToken);
  const { data, error } = await supabaseAdmin
    .from("sync_api_tokens")
    .select("id, officer_name, scopes, expires_at, revoked_at, last_used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo validar el token de sincronizacion: ${error.message}`);
  }

  const token = data as SyncApiToken | null;
  const now = new Date();
  if (!token || !isSyncTokenUsable(token, requiredScope, officerName, now)) {
    return false;
  }

  const lastUsedAt = token.last_used_at ? new Date(token.last_used_at).getTime() : 0;
  if (now.getTime() - lastUsedAt >= LAST_USED_UPDATE_INTERVAL_MS) {
    const { error: updateError } = await supabaseAdmin
      .from("sync_api_tokens")
      .update({ last_used_at: now.toISOString() })
      .eq("id", token.id);

    // El registro de uso es informativo y nunca debe tumbar una sincronizacion valida.
    if (updateError) {
      console.error("No se pudo actualizar last_used_at del token de sync:", updateError);
    }
  }

  return true;
}

/**
 * Validates the API Key for sync requests.
 * Returns a NextResponse with an error if invalid, or null if valid.
 */
export async function validateSyncRequest(request: Request, requiredScope: string) {
  const authHeader = request.headers.get("authorization") || "";
  const rawToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!rawToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let databaseError: unknown = null;
  try {
    const officerName = request.headers.get("x-officer-name");
    if (await validateStoredToken(rawToken, requiredScope, officerName)) {
      return null;
    }
  } catch (error) {
    databaseError = error;
    console.error("Error validando token de sync en base de datos:", error);
  }

  // Compatibilidad temporal para desplegar primero el servidor y luego rotar
  // cada instalacion de ScriptSkada. No volver a usar NEXT_PUBLIC_SYNC_API_KEY.
  const legacyKey = process.env.SYNC_API_KEY;
  if (legacyKey && safeTokenEquals(rawToken, legacyKey)) {
    return null;
  }

  if (databaseError) {
    return NextResponse.json(
      { error: "Server configuration error: sync token validation unavailable" },
      { status: 500 },
    );
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
