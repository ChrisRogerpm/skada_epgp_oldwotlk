import { NextResponse } from "next/server";
import { requireAdmin } from "@/src/infrastructure/auth/requireAdmin";
import { syncRaidItemsTask } from "@/src/infrastructure/services/syncRaidItems";

/**
 * Recalcula el botín por raid desde el admin (une las copias de ICC entre
 * jefes y separa las runs de RS). Con `dryRun: true` solo devuelve lo que
 * cambiaría. Solo toca filas con source = 'sync'.
 */
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json().catch(() => ({}));
    const days = Math.min(365, Math.max(1, parseInt(String(body.days ?? 30), 10) || 30));
    const dryRun = body.dryRun !== false;
    const result = await syncRaidItemsTask({
      lookbackDays: days,
      dryRun,
      actor: dryRun ? undefined : auth,
    });
    return NextResponse.json({ days, dryRun, ...result });
  } catch (error) {
    console.error("Admin raid items cleanup error:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
