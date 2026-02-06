import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: summary, error: summaryError } = await supabase
      .from("inventory_summary")
      .select("*")
      .single();

    if (summaryError) {
      return NextResponse.json({ error: summaryError.message }, { status: 500 });
    }

    const { data: models, error: modelsError } = await supabase
      .from("inventory_by_model")
      .select("*")
      .order("model_name", { ascending: true });

    if (modelsError) {
      return NextResponse.json({ error: modelsError.message }, { status: 500 });
    }

    return NextResponse.json({ summary, models });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
