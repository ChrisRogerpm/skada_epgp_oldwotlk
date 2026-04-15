import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    // 1. Fetch raids for the given date
    const { data: raids, error: raidsError } = await supabase
      .from("raids")
      .select("*")
      .eq("raid_date", date)
      .order("raid_time", { ascending: true });

    if (raidsError) throw raidsError;

    if (!raids || raids.length === 0) {
      return NextResponse.json({ date, raids: [] });
    }

    // 2. Fetch participants for all these raids
    const raidIds = raids.map((r) => r.id);
    const { data: participants, error: participantsError } = await supabase
      .from("raid_participants")
      .select("*")
      .in("raid_id", raidIds)
      .order("player_group", { ascending: true });

    if (participantsError) throw participantsError;

    // 3. Group participants by raid_id
    const raidsWithParticipants = raids.map((raid) => ({
      ...raid,
      participants: (participants || []).filter((p) => p.raid_id === raid.id),
    }));

    return NextResponse.json({
      date,
      raids: raidsWithParticipants,
    });
  } catch (error) {
    console.error("Error fetching from Supabase (raids):", error);
    return NextResponse.json(
      {
        error: "Error fetching data from Supabase",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
