import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: summary, error: summaryError } = await supabase
      .from("demo_summary")
      .select("*")
      .single();

    if (summaryError) {
      return NextResponse.json({ error: summaryError.message }, { status: 500 });
    }

    const { data: movements, error: movementError } = await supabase
      .from("device_movements")
      .select(
        "id, device_id, moved_at, reason, notes, from_location_type, to_location_type, from_hospital_id, to_hospital_id, from_warehouse_id, to_warehouse_id"
      )
      .order("moved_at", { ascending: false })
      .limit(10);

    if (movementError) {
      return NextResponse.json({ error: movementError.message }, { status: 500 });
    }

    return NextResponse.json({ summary, movements });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
