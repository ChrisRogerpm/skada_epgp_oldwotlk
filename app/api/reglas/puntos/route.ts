import { NextResponse } from "next/server";
import { requireAdmin } from "@/src/infrastructure/auth/requireAdmin";
import { SupabaseReglasRepository } from "@/src/infrastructure/repositories/SupabaseReglasRepository";
import { CreateReglaPuntoUseCase } from "@/src/application/useCases/CreateReglaPuntoUseCase";
import { UpdateReglaPuntoUseCase } from "@/src/application/useCases/UpdateReglaPuntoUseCase";
import { DeleteReglaPuntoUseCase } from "@/src/application/useCases/DeleteReglaPuntoUseCase";
import { invalidateCache } from "@/src/infrastructure/cache/cache";

// Alta/edición/baja por fila de un bono o sanción (reglas_puntos). Mismo
// reemplazo del "Guardar Todo" que en /api/reglas/loteo.
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { tipo, categoria, descripcion, valor, iconUrl } = body;

    const repository = new SupabaseReglasRepository();
    const useCase = new CreateReglaPuntoUseCase(repository);
    const result = await useCase.execute({
      tipo,
      categoria,
      descripcion: descripcion || "",
      valor: Number(valor) || 0,
      iconUrl: iconUrl || "",
    });

    await invalidateCache("reglas");
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
    const { id, tipo, categoria, descripcion, valor, iconUrl } = body;

    const repository = new SupabaseReglasRepository();
    const useCase = new UpdateReglaPuntoUseCase(repository);
    const result = await useCase.execute(id, {
      tipo,
      categoria,
      descripcion: descripcion || "",
      valor: Number(valor) || 0,
      iconUrl: iconUrl || "",
    });

    await invalidateCache("reglas");
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

    const repository = new SupabaseReglasRepository();
    const useCase = new DeleteReglaPuntoUseCase(repository);
    await useCase.execute(id);

    await invalidateCache("reglas");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting regla de puntos:", error);
    return NextResponse.json({ error: error?.message || "Error interno del servidor" }, { status: 500 });
  }
}
