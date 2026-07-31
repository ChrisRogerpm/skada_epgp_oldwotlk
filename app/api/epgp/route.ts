import { NextResponse } from "next/server";
import { SupabaseEpgpRepository } from "@/src/infrastructure/repositories/SupabaseEpgpRepository";
import { GetEpgpRosterUseCase } from "@/src/application/useCases/GetEpgpRosterUseCase";
import { getOrSetCache } from "@/src/infrastructure/cache/cache";

export async function GET() {
  try {
    const result = await getOrSetCache(
      "epgp_roster",
      async () => {
        const repository = new SupabaseEpgpRepository();
        const useCase = new GetEpgpRosterUseCase(repository);
        return useCase.execute();
      },
      3 * 60 * 1000,
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in GET /api/epgp:", error);
    return NextResponse.json(
      { error: "Error fetching data" },
      { status: 500 }
    );
  }
}
