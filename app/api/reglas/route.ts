import { NextResponse } from "next/server";
import { SupabaseReglasRepository } from "@/src/infrastructure/repositories/SupabaseReglasRepository";
import { GetReglasUseCase } from "@/src/application/useCases/GetReglasUseCase";
import { getOrSetCache } from "@/src/infrastructure/cache/cache";

export async function GET() {
  try {
    const result = await getOrSetCache(
      "reglas",
      async () => {
        const repository = new SupabaseReglasRepository();
        const useCase = new GetReglasUseCase(repository);
        return useCase.execute();
      },
      5 * 60 * 1000,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error crítico:", error);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}
