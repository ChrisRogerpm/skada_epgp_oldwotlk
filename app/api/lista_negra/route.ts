import { NextResponse } from "next/server";
import { SupabaseListaNegraRepository } from "@/src/infrastructure/repositories/SupabaseListaNegraRepository";
import { GetListaNegraUseCase } from "@/src/application/useCases/GetListaNegraUseCase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const repository = new SupabaseListaNegraRepository();
    const useCase = new GetListaNegraUseCase(repository);

    const data = await useCase.execute();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Critical error in lista_negra API:", error);
    // Para mantener la compatibilidad con el front que podría estar esperando { error: error.message }
    const message = error?.message || "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
