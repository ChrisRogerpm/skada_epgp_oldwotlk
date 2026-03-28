import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { z } from "zod";

const QuerySchema = z.object({
  names: z.string().min(1), // Recibe "Main,Alter1,Alter2"
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const namesParam = searchParams.get("names");

    if (!namesParam) {
      return NextResponse.json({ error: "Character names are required" }, { status: 400 });
    }

    const nameList = namesParam.split(",");

    // Consultar historial en Supabase usando la tabla existente epgp_logs
    // Usamos .in() para traer registros de cualquiera de los personajes de la lista
    const { data, error } = await supabase
      .from("epgp_logs")
      .select("*")
      .in("personaje", nameList)
      .order("fecha", { ascending: false })
      .order("hour", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching EPGP history:", error);
    return NextResponse.json(
      {
        error: "Error fetching data from Supabase",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
