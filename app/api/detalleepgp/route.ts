import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { getOrSetCache } from "../../../lib/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let fechaFilter = searchParams.get("fecha");

    // Si no hay fecha en el query, calculamos la actual en Lima
    if (!fechaFilter) {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        timeZone: "America/Lima", 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      };
      fechaFilter = now.toLocaleDateString('es-PE', options);
    }

    // Si la fecha es "all", no traemos nada para evitar consumo excesivo de lectura
    if (fechaFilter === "all") {
      return NextResponse.json([]);
    }

    const cacheKey = `epgp_logs_${fechaFilter.replace(/\//g, "-")}`;
    const result = await getOrSetCache(cacheKey, async () => {
      const { data, error } = await supabase
        .from('epgp_logs')
        .select('*')
        .eq('fecha', fechaFilter);

      if (error) throw error;
      return data || [];
    }, 0); // Caché deshabilitado

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching from Supabase (epgp_logs):", error);
    return NextResponse.json(
      { error: "Error fetching data from Supabase" },
      { status: 500 }
    );
  }
}
