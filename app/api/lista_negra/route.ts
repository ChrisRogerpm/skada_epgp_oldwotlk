import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("lista_negra")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching lista_negra:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Critical error in lista_negra API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
