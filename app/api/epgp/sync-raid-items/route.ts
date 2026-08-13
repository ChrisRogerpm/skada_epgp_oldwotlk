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
 * Uses the same Bearer token as the other sync endpoints
 * (NEXT_PUBLIC_SYNC_API_KEY).
 */
export async function POST(request: Request) {
  const authError = validateSyncRequest(request);
  if (authError) return authError;

  try {
    await syncRaidItemsTask();
    return NextResponse.json({ message: "Raid items sync completed" });
  } catch (error: any) {
    console.error("Manual Raid Items Sync Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
