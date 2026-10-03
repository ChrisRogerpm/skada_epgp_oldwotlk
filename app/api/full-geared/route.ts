import { NextResponse } from "next/server";
import { SupabaseFullGearedRepository } from "@/src/infrastructure/repositories/SupabaseFullGearedRepository";
import { GetFullGearedCharactersUseCase } from "@/src/application/useCases/GetFullGearedCharactersUseCase";
import { CreateFullGearedCharacterUseCase } from "@/src/application/useCases/CreateFullGearedCharacterUseCase";
import { UpdateFullGearedCharacterUseCase } from "@/src/application/useCases/UpdateFullGearedCharacterUseCase";
import { DeleteFullGearedCharacterUseCase } from "@/src/application/useCases/DeleteFullGearedCharacterUseCase";
import { getOrSetCache } from "@/src/infrastructure/cache/cache";
import { requireAdmin } from "@/src/infrastructure/auth/requireAdmin";
import { logAdminActivity } from "@/src/infrastructure/services/adminActivity";
import { getSupabaseAdmin } from "@/src/infrastructure/config/supabaseAdmin";

const raidsLabel = (icc: unknown, rs: unknown) =>
  [icc ? "ICC" : null, rs ? "RS" : null].filter(Boolean).join(" + ") || "ninguna raid";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";

    const load = () => {
      const repository = new SupabaseFullGearedRepository();
      const useCase = new GetFullGearedCharactersUseCase(repository);
      return useCase.execute(page, limit, search);
    };
    // El admin pide `fresh=1` para ver sus propios cambios al momento.
    const cacheKey = `full_geared_${page}_${limit}_${search.toLowerCase()}`;
    const result =
      searchParams.get("fresh") === "1" ? await load() : await getOrSetCache(cacheKey, load, 30 * 1000);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching full geared characters:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { name, class: characterClass, icc, rs, gs, main } = body;

    const repository = new SupabaseFullGearedRepository();
    const useCase = new CreateFullGearedCharacterUseCase(repository);

    const newCharacter = await useCase.execute({ name, class: characterClass, icc, rs, gs, main });
    await logAdminActivity({
      auth,
      action: "fullgear.create",
      summary: `Marcó a ${name} como Full Gear (${raidsLabel(icc, rs)}) · GS ${gs}`,
      details: { name, icc: !!icc, rs: !!rs, gs },
    });

    return NextResponse.json(newCharacter);
  } catch (error) {
    console.error("Error creating full geared character:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { id, name, class: characterClass, icc, rs, gs, main } = body;

    const repository = new SupabaseFullGearedRepository();
    const useCase = new UpdateFullGearedCharacterUseCase(repository);

    const updatedCharacter = await useCase.execute({ id, name, class: characterClass, icc, rs, gs, main });
    await logAdminActivity({
      auth,
      action: "fullgear.update",
      summary: `Actualizó a ${name} (${raidsLabel(icc, rs)}) · GS ${gs}`,
      details: { id, name, icc: !!icc, rs: !!rs, gs },
    });

    return NextResponse.json(updatedCharacter);
  } catch (error) {
    console.error("Error updating full geared character:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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
      .from("full_geared_characters")
      .select("name")
      .eq("id", id)
      .maybeSingle();

    const repository = new SupabaseFullGearedRepository();
    const useCase = new DeleteFullGearedCharacterUseCase(repository);

    await useCase.execute(id);
    await logAdminActivity({
      auth,
      action: "fullgear.delete",
      summary: `Quitó a ${before?.name ?? "un personaje"} de Full Gear`,
      details: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting full geared character:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
