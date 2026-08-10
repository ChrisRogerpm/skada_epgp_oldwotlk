import { NextResponse } from "next/server";
import { requireAdmin } from "@/src/infrastructure/auth/requireAdmin";
import { SupabaseReglasRepository } from "@/src/infrastructure/repositories/SupabaseReglasRepository";
import { CreateReglaLoteoUseCase } from "@/src/application/useCases/CreateReglaLoteoUseCase";
import { UpdateReglaLoteoUseCase } from "@/src/application/useCases/UpdateReglaLoteoUseCase";
import { DeleteReglaLoteoUseCase } from "@/src/application/useCases/DeleteReglaLoteoUseCase";
import { invalidateCache } from "@/src/infrastructure/cache/cache";

// Alta/edición/baja por fila de una regla de loteo. Reemplaza el antiguo
// "Guardar Todo" (delete masivo + insert masivo) por escrituras individuales,
// protegidas igual que el resto del admin.
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { raidCode, categoria, nombreItem, requisitos, valorMinimo, iconUrl, idItem } = body;

    const repository = new SupabaseReglasRepository();
    const useCase = new CreateReglaLoteoUseCase(repository);
    const result = await useCase.execute({
      raidCode,
      categoria,
      nombreItem,
      requisitos: Array.isArray(requisitos) ? requisitos : [],
      valorMinimo: Number(valorMinimo) || 0,
      iconUrl: iconUrl || "",
      idItem: idItem ?? null,
    });

    await invalidateCache("reglas");
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error creating regla de loteo:", error);
    return NextResponse.json({ error: error?.message || "Error interno del servidor" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { id, raidCode, categoria, nombreItem, requisitos, valorMinimo, iconUrl, idItem } = body;

    const repository = new SupabaseReglasRepository();
    const useCase = new UpdateReglaLoteoUseCase(repository);
    const result = await useCase.execute(id, {
      raidCode,
      categoria,
      nombreItem,
      requisitos: Array.isArray(requisitos) ? requisitos : [],
      valorMinimo: Number(valorMinimo) || 0,
      iconUrl: iconUrl || "",
      idItem: idItem ?? null,
    });

    await invalidateCache("reglas");
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error updating regla de loteo:", error);
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
    const useCase = new DeleteReglaLoteoUseCase(repository);
    await useCase.execute(id);

    await invalidateCache("reglas");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting regla de loteo:", error);
    return NextResponse.json({ error: error?.message || "Error interno del servidor" }, { status: 500 });
  }
}
