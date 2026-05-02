import { NextResponse } from "next/server";
import { SupabaseReglasRepository } from "@/src/infrastructure/repositories/SupabaseReglasRepository";
import { GetReglasUseCase } from "@/src/application/useCases/GetReglasUseCase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  console.log("Reglas API: Iniciando revisión de Beneficios y Perjuicios...");
  try {
    const repository = new SupabaseReglasRepository();
    const useCase = new GetReglasUseCase(repository);

    const result = await useCase.execute();

    // To preserve the exact console.log as before
    const beneficiosCount = result[1].Beneficios.length;
    const perjuiciosCount = result[2].Perjuicios.length;
    console.log(
      `Reglas API: Beneficios (${beneficiosCount}), Perjuicios (${perjuiciosCount})`,
    );
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error crítico:", error);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}
