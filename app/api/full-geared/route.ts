import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('full_geared_characters')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,main.ilike.%${search}%,class.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order('gs', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return NextResponse.json({
      data,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (error) {
    console.error("Error fetching full geared characters:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, class: characterClass, icc, rs, gs, main } = body;

    const { data, error } = await supabase
      .from('full_geared_characters')
      .insert([{ name, class: characterClass, icc, rs, gs, main }])
      .select();

    if (error) throw error;
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Error creating full geared character:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, class: characterClass, icc, rs, gs, main } = body;

    const { data, error } = await supabase
      .from('full_geared_characters')
      .update({ name, class: characterClass, icc, rs, gs, main, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) throw error;
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Error updating full geared character:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const { error } = await supabase
      .from('full_geared_characters')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting full geared character:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
