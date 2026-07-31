import { NextResponse } from "next/server";
import { SupabaseEpgpRepository } from "@/src/infrastructure/repositories/SupabaseEpgpRepository";
import { GetEpgpHistoryByNamesUseCase } from "@/src/application/useCases/GetEpgpHistoryByNamesUseCase";
import { getOrSetCache } from "@/src/infrastructure/cache/cache";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const namesParam = searchParams.get("names");

    const cacheKey = `epgp_history_${(namesParam || "").toLowerCase()}`;
    const result = await getOrSetCache(
      cacheKey,
      async () => {
        const repository = new SupabaseEpgpRepository();
        const useCase = new GetEpgpHistoryByNamesUseCase(repository);
        return useCase.execute({ names: namesParam });
      },
      2 * 60 * 1000,
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching EPGP history:", error);
    return NextResponse.json(
      {
        error: "Error fetching data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: error.message === "Character names are required" ? 400 : 500 },
    );
  }
}
