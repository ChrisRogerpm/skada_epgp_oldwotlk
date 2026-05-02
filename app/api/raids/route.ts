import { NextResponse } from "next/server";
import { SupabaseRaidsRepository } from "@/src/infrastructure/repositories/SupabaseRaidsRepository";
import { GetRaidsByDateUseCase } from "@/src/application/useCases/GetRaidsByDateUseCase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const repository = new SupabaseRaidsRepository();
    const useCase = new GetRaidsByDateUseCase(repository);

    const result = await useCase.execute(date);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching from Supabase (raids):", error);
    return NextResponse.json(
      {
        error: "Error fetching data from Supabase",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
