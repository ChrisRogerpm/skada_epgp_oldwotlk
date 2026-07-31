import { NextResponse } from "next/server";
import { SupabaseListaNegraRepository } from "@/src/infrastructure/repositories/SupabaseListaNegraRepository";
import { GetListaNegraUseCase } from "@/src/application/useCases/GetListaNegraUseCase";
import { getOrSetCache } from "@/src/infrastructure/cache/cache";

export async function GET() {
  try {
    const data = await getOrSetCache(
      "lista_negra",
      async () => {
        const repository = new SupabaseListaNegraRepository();
        const useCase = new GetListaNegraUseCase(repository);
        return useCase.execute();
      },
      5 * 60 * 1000,
    );

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Critical error in lista_negra API:", error);
    // Para mantener la compatibilidad con el front que podría estar esperando { error: error.message }
    const message = error?.message || "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
