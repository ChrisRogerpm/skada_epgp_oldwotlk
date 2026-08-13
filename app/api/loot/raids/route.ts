import { NextResponse } from "next/server";
import { SupabaseLootRepository } from "@/src/infrastructure/repositories/SupabaseLootRepository";
import { GetLootRaidOptionsUseCase } from "@/src/application/useCases/GetLootRaidOptionsUseCase";

// Sesiones de raid existentes, para que el admin vincule un registro manual
// a un evento real en vez de inventar uno suelto. Sin caché larga: se usa
// desde un formulario que necesita ver raids recién sincronizadas.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "30");

    const repository = new SupabaseLootRepository();
    const useCase = new GetLootRaidOptionsUseCase(repository);
    const result = await useCase.execute(limit, search);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching raid options:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
