import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: roster, error } = await supabase
      .from('epgp')
      .select('*');

    if (error) throw error;

    if (!roster || roster.length === 0) {
      return NextResponse.json({ date: "", hour: "", roster: [] });
    }

    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { timeZone: "America/Lima", year: 'numeric', month: '2-digit', day: '2-digit' };
    const timeOptions: Intl.DateTimeFormatOptions = { timeZone: "America/Lima", hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    
    const limaDate = now.toLocaleDateString('en-GB', options).split('/').reverse().join('-'); // YYYY-MM-DD
    const limaTime = now.toLocaleTimeString('en-GB', timeOptions);

    return NextResponse.json({ 
      date: limaDate,
      hour: limaTime,
      roster 
    });
  } catch (error) {
    console.error("Error fetching from Supabase (epgp):", error);
    return NextResponse.json(
      { error: "Error fetching data from Supabase" },
      { status: 500 }
    );
  }
}
