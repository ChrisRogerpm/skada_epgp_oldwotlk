import { NextResponse } from "next/server";
import { SupabaseEpgpRepository } from "@/src/infrastructure/repositories/SupabaseEpgpRepository";
import { GetEpgpHistoryByNamesUseCase } from "@/src/application/useCases/GetEpgpHistoryByNamesUseCase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const namesParam = searchParams.get("names");

    const repository = new SupabaseEpgpRepository();
    const useCase = new GetEpgpHistoryByNamesUseCase(repository);
    const result = await useCase.execute({ names: namesParam });

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
