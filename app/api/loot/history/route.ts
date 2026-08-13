import { NextResponse } from "next/server";
import { SupabaseLootRepository } from "@/src/infrastructure/repositories/SupabaseLootRepository";
import { GetLootHistoryByCharactersUseCase } from "@/src/application/useCases/GetLootHistoryByCharactersUseCase";
import { getOrSetCache } from "@/src/infrastructure/cache/cache";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const namesParam = searchParams.get("names");

    const cacheKey = `loot_history_${(namesParam || "").toLowerCase()}`;
    const result = await getOrSetCache(
      cacheKey,
      async () => {
        const repository = new SupabaseLootRepository();
        const useCase = new GetLootHistoryByCharactersUseCase(repository);
        return useCase.execute(namesParam);
      },
      60 * 1000,
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching loot history:", error);
    return NextResponse.json(
      { error: error?.message || "Error interno del servidor" },
      { status: error?.message === "Character names are required" ? 400 : 500 },
    );
  }
}
