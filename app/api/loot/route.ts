import { NextResponse } from "next/server";
import { requireAdmin } from "@/src/infrastructure/auth/requireAdmin";
import { SupabaseLootRepository } from "@/src/infrastructure/repositories/SupabaseLootRepository";
import { GetRecentLootWinsUseCase } from "@/src/application/useCases/GetRecentLootWinsUseCase";
import { RegisterLootWinsUseCase } from "@/src/application/useCases/RegisterLootWinsUseCase";
import { UpdateLootWinUseCase } from "@/src/application/useCases/UpdateLootWinUseCase";
import { DeleteLootWinUseCase } from "@/src/application/useCases/DeleteLootWinUseCase";

// Listado paginado de registros de loot (para el módulo admin). Requiere admin
// porque expone datos de auditoría (source, created_by) vía service role.
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const repository = new SupabaseLootRepository();
    const useCase = new GetRecentLootWinsUseCase(repository);
    const result = await useCase.execute(page, limit, search);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error listing loot wins:", error);
    return NextResponse.json({ error: error?.message || "Error interno del servidor" }, { status: 500 });
  }
}

// Registra uno o varios ítems ganados por el mismo personaje de una sola vez
// (multi-select en el admin): acepta `id_items` (array) o, por compatibilidad,
// un único `id_item`.
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { personaje, class: characterClass, id_items, id_item, id_raids, note } = body;

    const items: number[] = Array.isArray(id_items) ? id_items : id_item ? [id_item] : [];

    const repository = new SupabaseLootRepository();
    const useCase = new RegisterLootWinsUseCase(repository);
    const result = await useCase.execute(
      { personaje, class: characterClass, id_items: items, id_raids: id_raids || null, note },
      auth.userId ?? null,
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error registering loot wins:", error);
    return NextResponse.json({ error: error?.message || "Error interno del servidor" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { id, personaje, class: characterClass, id_item, id_raids, note } = body;

    const repository = new SupabaseLootRepository();
    const useCase = new UpdateLootWinUseCase(repository);
    const result = await useCase.execute({ id, personaje, class: characterClass, id_item, id_raids: id_raids || null, note });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error updating loot win:", error);
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

    const repository = new SupabaseLootRepository();
    const useCase = new DeleteLootWinUseCase(repository);
    await useCase.execute(parseInt(id, 10));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting loot win:", error);
    return NextResponse.json({ error: error?.message || "Error interno del servidor" }, { status: 500 });
  }
}
