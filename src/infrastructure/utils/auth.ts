import { NextResponse } from "next/server";

/**
 * Validates the API Key for sync requests.
 * Returns a NextResponse with an error if invalid, or null if valid.
 */
export function validateSyncRequest(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.NEXT_PUBLIC_SYNC_API_KEY;

  if (!expectedKey) {
    return NextResponse.json(
      { error: "Server configuration error: SYNC_API_KEY is missing" },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
