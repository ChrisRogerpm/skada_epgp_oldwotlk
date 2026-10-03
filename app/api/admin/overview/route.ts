import { NextResponse } from "next/server";
import { requireAdmin } from "@/src/infrastructure/auth/requireAdmin";
import { getOrSetCache, invalidateCache } from "@/src/infrastructure/cache/cache";
import { getAdminOverview } from "@/src/infrastructure/services/adminOverview";

/** Resumen del panel de oficiales: actividad de la semana y avisos pendientes. */
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    // `fresh=1` recalcula tras una acción del oficial (y deja el resultado en caché).
    if (new URL(request.url).searchParams.get("fresh") === "1") {
      await invalidateCache("admin_overview");
    }
    const overview = await getOrSetCache("admin_overview", getAdminOverview, 60 * 1000);
    return NextResponse.json(overview);
  } catch (error) {
    console.error("Error building admin overview:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
