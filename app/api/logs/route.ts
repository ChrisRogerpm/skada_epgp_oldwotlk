import { NextResponse } from "next/server";
import { SupabaseLogsRepository } from "@/src/infrastructure/repositories/SupabaseLogsRepository";
import { GetLogsUseCase } from "@/src/application/useCases/GetLogsUseCase";
import { getOrSetCache } from "@/src/infrastructure/cache/cache";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const cacheKey = `logs_${date}_${limit}_${offset}`;
    const result = await getOrSetCache(
      cacheKey,
      async () => {
        const repository = new SupabaseLogsRepository();
        const useCase = new GetLogsUseCase(repository);
        return useCase.execute(date, limit, offset);
      },
      5 * 60 * 1000,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching logs via UseCase:", error);
    return NextResponse.json(
      {
        error: "Error fetching data from Supabase",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
