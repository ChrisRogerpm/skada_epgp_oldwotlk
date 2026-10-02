import { NextResponse } from "next/server";
import { syncRaidItemsTask } from "@/src/infrastructure/services/syncRaidItems";
import { validateSyncRequest } from "@/src/infrastructure/utils/auth";

/**
 * Manual trigger for the Raid Items background sync.
 *
 * Unlike the sync endpoints (epgp/sync, raidcomposition/sync), which fire this
 * task as a side effect via `after()`, this endpoint runs it directly and
 * awaits the result — useful to force a resync (e.g. logs that were already
 * uploaded but never got matched to raid_items) without waiting for the next
 * addon sync.
 *
 * `?days=N` (1–365, por defecto 7) amplía la ventana: sirve para recalcular
 * el histórico y limpiar los ítems que la versión anterior duplicaba en cada
 * jefe de ICC. Solo toca filas con source = 'sync'.
 *
 * Uses the same Bearer token as the other sync endpoints
 * (token individual almacenado como hash en sync_api_tokens).
 */
export async function POST(request: Request) {
  const authError = await validateSyncRequest(request, "raid-items:write");
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const days = Math.min(365, Math.max(1, parseInt(searchParams.get("days") || "7", 10) || 7));

  try {
    const result = await syncRaidItemsTask({ lookbackDays: days });
    return NextResponse.json({ message: "Raid items sync completed", days, ...result });
  } catch (error) {
    console.error("Manual Raid Items Sync Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
