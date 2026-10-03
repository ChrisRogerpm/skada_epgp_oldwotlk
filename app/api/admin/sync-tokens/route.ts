import { NextResponse } from "next/server";
import { requireAdmin } from "@/src/infrastructure/auth/requireAdmin";
import { logAdminActivity } from "@/src/infrastructure/services/adminActivity";
import {
  createSyncToken,
  listSyncTokens,
  revokeSyncToken,
  SYNC_TOKEN_SCOPES,
} from "@/src/infrastructure/services/syncTokens";

/** Tokens de ScriptSkada (lo mismo que `npm run sync-token`, desde el admin). */
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    return NextResponse.json({ data: await listSyncTokens(), scopes: SYNC_TOKEN_SCOPES });
  } catch (error) {
    console.error("Error listing sync tokens:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { token, row } = await createSyncToken({
      name: body.name,
      officerName: body.officerName,
      scopes: Array.isArray(body.scopes) ? body.scopes : undefined,
      expiresAt: body.expiresAt,
      createdBy: auth.userId,
    });
    await logAdminActivity({
      auth,
      action: "token.create",
      summary: `Creó el token «${row.name}» (${row.scopes.join(", ")})`,
      details: { id: row.id, prefix: row.token_prefix },
    });
    // El token en claro solo viaja en esta respuesta: en la base queda su hash.
    return NextResponse.json({ token, row });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  try {
    const row = await revokeSyncToken(id);
    await logAdminActivity({
      auth,
      action: "token.revoke",
      summary: `Revocó el token «${row.name}»`,
      details: { id: row.id, prefix: row.token_prefix },
    });
    return NextResponse.json(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
