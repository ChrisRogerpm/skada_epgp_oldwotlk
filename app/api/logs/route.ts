import { NextResponse } from "next/server";
import { SupabaseLogsRepository } from "@/src/infrastructure/repositories/SupabaseLogsRepository";
import { GetLogsUseCase } from "@/src/application/useCases/GetLogsUseCase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const repository = new SupabaseLogsRepository();
    const useCase = new GetLogsUseCase(repository);

    const result = await useCase.execute(date, limit, offset);

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
