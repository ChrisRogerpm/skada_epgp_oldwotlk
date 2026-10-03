import { NextResponse } from "next/server";
import { requireAdmin } from "@/src/infrastructure/auth/requireAdmin";
import { SupabaseReglasRepository } from "@/src/infrastructure/repositories/SupabaseReglasRepository";
import { CreateReglaPuntoUseCase } from "@/src/application/useCases/CreateReglaPuntoUseCase";
import { UpdateReglaPuntoUseCase } from "@/src/application/useCases/UpdateReglaPuntoUseCase";
import { DeleteReglaPuntoUseCase } from "@/src/application/useCases/DeleteReglaPuntoUseCase";
import { invalidateCache } from "@/src/infrastructure/cache/cache";
import { getSupabaseAdmin } from "@/src/infrastructure/config/supabaseAdmin";
import { logAdminActivity } from "@/src/infrastructure/services/adminActivity";

// Alta/edición/baja por fila de un bono o sanción (reglas_puntos). Mismo
// reemplazo del "Guardar Todo" que en /api/reglas/loteo.
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { tipo, categoria, descripcion, valor, iconUrl, sortOrder } = body;

    const repository = new SupabaseReglasRepository();
    const useCase = new CreateReglaPuntoUseCase(repository);
    const result = await useCase.execute({
      tipo,
      categoria,
      descripcion: descripcion || "",
      valor: Number(valor) || 0,
      iconUrl: iconUrl || "",
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
    });

    await invalidateCache("reglas");
    await logAdminActivity({
      auth,
      action: "rule.puntos.create",
      summary: `Creó ${tipo === "perjuicio" ? "la sanción" : "la bonificación"} «${descripcion || ""}» (${Number(valor) || 0})`,
      details: { tipo, categoria },
    });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error creating regla de puntos:", error);
    return NextResponse.json({ error: error?.message || "Error interno del servidor" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { id, tipo, categoria, descripcion, valor, iconUrl, sortOrder } = body;

    const repository = new SupabaseReglasRepository();
    const useCase = new UpdateReglaPuntoUseCase(repository);
    const result = await useCase.execute(id, {
      tipo,
      categoria,
      descripcion: descripcion || "",
      valor: Number(valor) || 0,
      iconUrl: iconUrl || "",
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
    });

    await invalidateCache("reglas");
    // Reordenar envía sortOrder: no se registra para no llenar el historial.
    if (sortOrder === undefined) {
      await logAdminActivity({
        auth,
        action: "rule.puntos.update",
        summary: `Editó ${tipo === "perjuicio" ? "la sanción" : "la bonificación"} «${descripcion || ""}» (${Number(valor) || 0})`,
        details: { id, tipo, categoria },
      });
    }
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error updating regla de puntos:", error);
    return NextResponse.json({ error: error?.message || "Error interno del servidor" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const { data: before } = await getSupabaseAdmin()
      .from("reglas_puntos")
      .select("tipo, descripcion, valor")
      .eq("id", id)
      .maybeSingle();

    const repository = new SupabaseReglasRepository();
    const useCase = new DeleteReglaPuntoUseCase(repository);
    await useCase.execute(id);

    await invalidateCache("reglas");
    await logAdminActivity({
      auth,
      action: "rule.puntos.delete",
      summary: `Eliminó la regla «${before?.descripcion ?? ""}»`,
      details: { id, ...(before ?? {}) },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting regla de puntos:", error);
    return NextResponse.json({ error: error?.message || "Error interno del servidor" }, { status: 500 });
  }
}
