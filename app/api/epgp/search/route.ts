import { NextResponse } from "next/server";
import { SupabaseEpgpRepository } from "@/src/infrastructure/repositories/SupabaseEpgpRepository";
import { SearchEpgpCharactersUseCase } from "@/src/application/useCases/SearchEpgpCharactersUseCase";
import { getOrSetCache } from "@/src/infrastructure/cache/cache";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  try {
    const result = await getOrSetCache(
      `epgp_search_${(query || "").toLowerCase()}`,
      async () => {
        const repository = new SupabaseEpgpRepository();
        const useCase = new SearchEpgpCharactersUseCase(repository);
        return useCase.execute({ query });
      },
      60 * 1000,
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error searching characters:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
