import { NextResponse } from "next/server";
import { requireAdmin } from "@/src/infrastructure/auth/requireAdmin";
import { listAdminActivity } from "@/src/infrastructure/services/adminActivity";

/**
 * Registro de actividad del panel. `available: false` indica que todavía no
 * se ha creado la tabla (supabase_admin_activity_migration.sql).
 */
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50));
    const result = await listAdminActivity({
      limit,
      before: searchParams.get("before") || undefined,
      actor: searchParams.get("actor") || undefined,
      actionPrefix: searchParams.get("type") || undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error listing admin activity:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
