import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json([]);
  }

  try {
    // La consulta busca tanto en el main como en el array de alters
    const { data, error } = await supabase.rpc('search_characters', { 
      search_term: `%${query}%` 
    });

    if (error) {
        // Si la función RPC no existe, usamos una consulta directa
        console.warn("RPC 'search_characters' not found, falling back to manual search");
        
        const { data: epgpData, error: epgpError } = await supabase
            .from('epgp')
            .select('main, alters, class, icon');

        if (epgpError) throw epgpError;

        const results: any[] = [];
        const searchTermLower = query.toLowerCase();

        epgpData.forEach((row: any) => {
            // Check main
            if (row.main.toLowerCase().includes(searchTermLower)) {
                results.push({
                    main: row.main,
                    nombre_alter: row.main,
                    clase: row.class || "Unknown",
                    url_icono: row.icon || ""
                });
            }

            // Check alters
            if (row.alters && Array.isArray(row.alters)) {
                row.alters.forEach((alt: any) => {
                    if (alt.name && alt.name.toLowerCase().includes(searchTermLower)) {
                        results.push({
                            main: row.main,
                            nombre_alter: alt.name,
                            clase: alt.class || "Unknown",
                            url_icono: alt.icon || ""
                        });
                    }
                });
            }
        });

        // Remove duplicates by nombre_alter
        const uniqueResults = results.filter((v, i, a) => a.findIndex(t => (t.nombre_alter === v.nombre_alter)) === i);
        return NextResponse.json(uniqueResults.slice(0, 10));
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error searching characters:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
