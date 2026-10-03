import { NextResponse } from "next/server";
import { requireAdmin } from "@/src/infrastructure/auth/requireAdmin";
import { findRecentEncounter } from "@/src/infrastructure/services/lootAutoLink";

/** Run a la que quedaría vinculado un registro manual (vista previa del formulario). */
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const encounter = await findRecentEncounter(
      searchParams.get("personaje") || "",
      searchParams.get("raid") || "",
    );
    return NextResponse.json({ encounter });
  } catch (error) {
    console.error("Error finding loot encounter:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
