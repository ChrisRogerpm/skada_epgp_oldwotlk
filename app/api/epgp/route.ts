import { NextResponse } from "next/server";
import { SupabaseEpgpRepository } from "@/src/infrastructure/repositories/SupabaseEpgpRepository";
import { GetEpgpRosterUseCase } from "@/src/application/useCases/GetEpgpRosterUseCase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const repository = new SupabaseEpgpRepository();
    const useCase = new GetEpgpRosterUseCase(repository);
    const result = await useCase.execute();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in GET /api/epgp:", error);
    return NextResponse.json(
      { error: "Error fetching data" },
      { status: 500 }
    );
  }
}
