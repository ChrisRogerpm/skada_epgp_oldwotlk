import { NextResponse } from "next/server";
import { requireAdmin } from "@/src/infrastructure/auth/requireAdmin";
import { getSupabaseAdmin } from "@/src/infrastructure/config/supabaseAdmin";
import { SupabaseLootRepository } from "@/src/infrastructure/repositories/SupabaseLootRepository";
import { GetRecentLootWinsUseCase } from "@/src/application/useCases/GetRecentLootWinsUseCase";
import { RegisterLootWinsUseCase } from "@/src/application/useCases/RegisterLootWinsUseCase";
import { UpdateLootWinUseCase } from "@/src/application/useCases/UpdateLootWinUseCase";
import { DeleteLootWinUseCase } from "@/src/application/useCases/DeleteLootWinUseCase";
import { logAdminActivity } from "@/src/infrastructure/services/adminActivity";
import { findRecentEncounter } from "@/src/infrastructure/services/lootAutoLink";

async function itemNames(ids: number[]) {
  if (!ids.length) return new Map<number, string>();
  const { data } = await getSupabaseAdmin().from("items").select("id_item, name").in("id_item", ids);
  return new Map((data ?? []).map((i) => [i.id_item as number, i.name as string]));
}

// Listado paginado de registros de loot (para el módulo admin). Requiere admin
// porque expone datos de auditoría (source, created_by) vía service role.
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(200, parseInt(searchParams.get("limit") || "10"));
    const search = searchParams.get("search") || "";
    const source = searchParams.get("source");
    const days = parseInt(searchParams.get("days") || "0", 10);

    const repository = new SupabaseLootRepository();
    const useCase = new GetRecentLootWinsUseCase(repository);
    const result = await useCase.execute(page, limit, search, {
      raid: searchParams.get("raid") || undefined,
      source: source === "sync" || source === "manual" ? source : undefined,
      days: days > 0 ? days : undefined,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error listing loot wins:", error);
    return NextResponse.json({ error: error?.message || "Error interno del servidor" }, { status: 500 });
  }
}

// Registra uno o varios ítems ganados por el mismo personaje de una sola vez
// (multi-select en el admin): acepta `id_items` (array) o, por compatibilidad,
// un único `id_item`. Si llega `raid` y no `id_raids`, se vincula solo al
// último kill de esa instancia en el que estuvo el jugador.
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { personaje, class: characterClass, id_items, id_item, id_raids, note, raid } = body;

    const items: number[] = Array.isArray(id_items) ? id_items : id_item ? [id_item] : [];

    const encounter =
      !id_raids && raid
        ? await findRecentEncounter(personaje, raid).catch((error) => {
            console.error("No se pudo vincular el botín a una raid:", error);
            return null;
          })
        : null;

    const repository = new SupabaseLootRepository();
    const useCase = new RegisterLootWinsUseCase(repository);
    const register = (linkTo: string | null) =>
      useCase.execute(
        { personaje, class: characterClass, id_items: items, id_raids: linkTo, note },
        auth.userId ?? null,
      );

    let linked = encounter;
    let result;
    try {
      result = await register(id_raids || encounter?.id || null);
    } catch (error: any) {
      // El mismo ítem ya figura en ese kill (índice único): se guarda sin vincular.
      if (encounter && error?.code === "23505") {
        linked = null;
        result = await register(null);
      } else throw error;
    }

    const names = await itemNames(items);
    await logAdminActivity({
      auth,
      action: "loot.create",
      summary: `Registró ${items.map((i) => names.get(i) ?? `ítem ${i}`).join(", ")} → ${personaje}`,
      details: { ids: result.map((r) => r.id), personaje, id_items: items, id_raids: linked?.id ?? id_raids ?? null },
    });

    return NextResponse.json({ data: result, linked });
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

    const names = await itemNames([id_item]);
    await logAdminActivity({
      auth,
      action: "loot.update",
      summary: `Corrigió el registro de ${names.get(id_item) ?? `ítem ${id_item}`} → ${personaje}`,
      details: { id, personaje, id_item },
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error updating loot win:", error);
    return NextResponse.json({ error: error?.message || "Error interno del servidor" }, { status: 400 });
  }
}

// Borra uno (`id`) o varios (`ids=1,2,3`) registros.
export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const ids = (searchParams.get("ids") || searchParams.get("id") || "")
      .split(",")
      .map((v) => parseInt(v, 10))
      .filter((v) => Number.isFinite(v));

    if (!ids.length) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const { data: before } = await getSupabaseAdmin()
      .from("raid_items")
      .select("id, personaje, id_item, items(name)")
      .in("id", ids);

    const repository = new SupabaseLootRepository();
    const useCase = new DeleteLootWinUseCase(repository);
    for (const id of ids) await useCase.execute(id);

    const rows = (before ?? []) as unknown as { personaje: string; items: { name: string } | null }[];
    await logAdminActivity({
      auth,
      action: "loot.delete",
      summary:
        rows.length === 1
          ? `Eliminó ${rows[0].items?.name ?? "un ítem"} de ${rows[0].personaje}`
          : `Eliminó ${ids.length} registros de botín`,
      details: { ids },
    });

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error: any) {
    console.error("Error deleting loot win:", error);
    return NextResponse.json({ error: error?.message || "Error interno del servidor" }, { status: 500 });
  }
}
