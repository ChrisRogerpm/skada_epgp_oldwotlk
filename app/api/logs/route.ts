import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // opcional: ?date=2026-02-26

    let queryBuilder = supabase.from("skada").select("*");

    if (date) {
      queryBuilder = queryBuilder.eq("date", date);
    }

    const { data, error } = await queryBuilder;

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json([]);
    }

    // El frontend espera: { name (boss), date, Damage: [], Healing: [] }
    const result = data.map((item) => {
      const { name, date: docDate, data: response } = item;
      return {
        name,
        date: docDate,
        Damage: response.Damage || [],
        Healing: response.Healing || [],
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching from Supabase (skada):", error);
    return NextResponse.json(
      {
        error: "Error fetching data from Supabase",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
