import { NextResponse } from "next/server";
import { SupabaseLootRepository } from "@/src/infrastructure/repositories/SupabaseLootRepository";
import { GetLootMatrixUseCase } from "@/src/application/useCases/GetLootMatrixUseCase";
import { getOrSetCache } from "@/src/infrastructure/cache/cache";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raid = searchParams.get("raid") || "RS";

    const cacheKey = `loot_matrix_${raid.toUpperCase()}`;
    const result = await getOrSetCache(
      cacheKey,
      async () => {
        const repository = new SupabaseLootRepository();
        const useCase = new GetLootMatrixUseCase(repository);
        return useCase.execute(raid);
      },
      60 * 1000,
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching loot matrix:", error);
    return NextResponse.json(
      { error: error?.message || "Error interno del servidor" },
      { status: error?.message?.startsWith("Raid inválida") ? 400 : 500 },
    );
  }
}
