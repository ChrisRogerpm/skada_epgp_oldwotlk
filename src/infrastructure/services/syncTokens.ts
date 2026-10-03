import { randomBytes } from "crypto";
import { getSupabaseAdmin } from "@/src/infrastructure/config/supabaseAdmin";
import { hashSyncToken } from "@/src/infrastructure/utils/auth";

/** Mismos permisos que acepta scripts/manage-sync-tokens.mjs. */
export const SYNC_TOKEN_SCOPES = [
  "skada:write",
  "roster:write",
  "raidcomposition:write",
  "blacklist:write",
  "epgp:write",
  "raid-items:write",
  "rules:read",
] as const;

export interface SyncTokenRow {
  id: string;
  name: string;
  token_prefix: string;
  officer_name: string | null;
  scopes: string[];
  expires_at: string | null;
  revoked_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

export interface CreateSyncTokenInput {
  name: string;
  officerName?: string | null;
  scopes?: string[];
  expiresAt?: string | null;
  createdBy?: string | null;
}

const COLUMNS =
  "id, name, token_prefix, officer_name, scopes, expires_at, revoked_at, last_used_at, created_at";

export async function listSyncTokens(): Promise<SyncTokenRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("sync_api_tokens")
    .select(COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as SyncTokenRow[];
}

/** Crea un token y devuelve el valor en claro: es la única vez que se puede ver. */
export async function createSyncToken(input: CreateSyncTokenInput) {
  const name = input.name?.trim();
  if (!name) throw new Error("El nombre es obligatorio");

  const scopes = input.scopes?.length ? [...new Set(input.scopes)] : ["*"];
  const unknown = scopes.filter(
    (s) => s !== "*" && !(SYNC_TOKEN_SCOPES as readonly string[]).includes(s),
  );
  if (unknown.length) throw new Error(`Permisos desconocidos: ${unknown.join(", ")}`);

  let expiresAt: string | null = null;
  if (input.expiresAt) {
    const date = new Date(input.expiresAt);
    if (Number.isNaN(date.getTime())) throw new Error("Fecha de caducidad inválida");
    expiresAt = date.toISOString();
  }

  const rawToken = `sync_${randomBytes(32).toString("base64url")}`;
  const { data, error } = await getSupabaseAdmin()
    .from("sync_api_tokens")
    .insert({
      name,
      token_hash: hashSyncToken(rawToken),
      token_prefix: rawToken.slice(0, 17),
      officer_name: input.officerName?.trim() || null,
      scopes,
      expires_at: expiresAt,
      created_by: input.createdBy ?? null,
    })
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);

  return { token: rawToken, row: data as SyncTokenRow };
}

export async function revokeSyncToken(id: string): Promise<SyncTokenRow> {
  const { data, error } = await getSupabaseAdmin()
    .from("sync_api_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .is("revoked_at", null)
    .select(COLUMNS)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Token no encontrado o ya revocado");
  return data as SyncTokenRow;
}
