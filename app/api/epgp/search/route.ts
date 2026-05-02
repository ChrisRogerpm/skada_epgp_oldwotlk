import { NextResponse } from "next/server";
import { SupabaseEpgpRepository } from "@/src/infrastructure/repositories/SupabaseEpgpRepository";
import { SearchEpgpCharactersUseCase } from "@/src/application/useCases/SearchEpgpCharactersUseCase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  try {
    const repository = new SupabaseEpgpRepository();
    const useCase = new SearchEpgpCharactersUseCase(repository);
    const result = await useCase.execute({ query });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error searching characters:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
