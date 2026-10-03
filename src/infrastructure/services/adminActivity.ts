import { getSupabaseAdmin } from "@/src/infrastructure/config/supabaseAdmin";

export interface AdminActivityEntry {
  id: number;
  created_at: string;
  actor: string;
  action: string;
  summary: string;
  details: Record<string, unknown> | null;
}

export interface LogActivityInput {
  /** Resultado de requireAdmin; sin él la acción se atribuye al sync. */
  auth?: { userId?: string; email?: string | null } | null;
  action: string;
  summary: string;
  details?: Record<string, unknown>;
}

/** La tabla aún no existe (falta correr supabase_admin_activity_migration.sql). */
function isMissingTable(error: { code?: string } | null) {
  return error?.code === "PGRST205" || error?.code === "42P01";
}

/**
 * Registra una acción del panel. Es informativo: un fallo aquí nunca debe
 * tumbar la acción que lo originó, así que solo se avisa por consola.
 */
export async function logAdminActivity({ auth, action, summary, details }: LogActivityInput) {
  try {
    const { error } = await getSupabaseAdmin()
      .from("admin_activity")
      .insert({
        actor_id: auth?.userId ?? null,
        actor: auth ? (auth.email ?? "Oficial") : "Sync",
        action,
        summary,
        details: details ?? null,
      });
    if (error && !isMissingTable(error)) {
      console.error("No se pudo registrar la actividad del admin:", error.message);
    }
  } catch (error) {
    console.error("No se pudo registrar la actividad del admin:", error);
  }
}

export async function listAdminActivity({
  limit = 50,
  before,
  actor,
  actionPrefix,
}: {
  limit?: number;
  before?: string;
  actor?: string;
  actionPrefix?: string;
}): Promise<{ data: AdminActivityEntry[]; available: boolean }> {
  let query = getSupabaseAdmin()
    .from("admin_activity")
    .select("id, created_at, actor, action, summary, details")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (before) query = query.lt("created_at", before);
  if (actor) query = query.eq("actor", actor);
  if (actionPrefix) query = query.like("action", `${actionPrefix}%`);

  const { data, error } = await query;
  if (error) {
    if (isMissingTable(error)) return { data: [], available: false };
    throw new Error(error.message);
  }
  return { data: (data ?? []) as AdminActivityEntry[], available: true };
}
