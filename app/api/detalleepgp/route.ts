import { NextResponse } from "next/server";
import { getOrSetCache } from "@/src/infrastructure/cache/cache";
import { SupabaseEpgpRepository } from "@/src/infrastructure/repositories/SupabaseEpgpRepository";
import { GetEpgpLogsUseCase } from "@/src/application/useCases/GetEpgpLogsUseCase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fechaFilter = searchParams.get("fecha");

    // Si la fecha es "all", no traemos nada para evitar consumo excesivo de lectura
    if (fechaFilter === "all") {
      return NextResponse.json([]);
    }

    const repository = new SupabaseEpgpRepository();
    const useCase = new GetEpgpLogsUseCase(repository);
    
    const effectiveDate = fechaFilter || (() => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        timeZone: "America/Lima", 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      };
      return now.toLocaleDateString('es-PE', options);
    })();

    const cacheKey = `epgp_logs_${effectiveDate.replace(/\//g, "-")}`;
    const result = await getOrSetCache(cacheKey, async () => {
      return await useCase.execute({ fecha: fechaFilter });
    }, 0); // Caché deshabilitado

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in GET /api/detalleepgp:", error);
    return NextResponse.json(
      { error: "Error fetching data" },
      { status: 500 }
    );
  }
}
