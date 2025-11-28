import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Export all user data as JSON
 * GET /api/export
 * 
 * Returns a JSON file containing:
 * - User profile
 * - Person pins
 * - Actions
 * - Daily plans (with linked actions)
 * - Weekly summaries (with content prompts)
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all user data in parallel
    const [
      { data: profile },
      { data: pins },
      { data: actions },
      { data: dailyPlans },
      { data: weeklySummaries },
    ] = await Promise.all([
      supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single(),
      supabase
        .from("person_pins")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("actions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("daily_plans")
        .select(`
          *,
          daily_plan_actions (
            position,
            is_fast_win,
            actions (
              id,
              type,
              state,
              title,
              notes,
              due_date,
              snooze_until,
              created_at
            )
          )
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: false }),
      supabase
        .from("weekly_summaries")
        .select(`
          *,
          content_prompts (
            id,
            type,
            content,
            status,
            created_at
          )
        `)
        .eq("user_id", user.id)
        .order("week_start_date", { ascending: false }),
    ]);

    // Format the export data
    const exportData = {
      export_date: new Date().toISOString(),
      user_id: user.id,
      user_email: user.email,
      profile: profile || null,
      data: {
        pins: pins || [],
        actions: actions || [],
        daily_plans: dailyPlans || [],
        weekly_summaries: weeklySummaries || [],
      },
      summary: {
        total_pins: pins?.length || 0,
        total_actions: actions?.length || 0,
        total_daily_plans: dailyPlans?.length || 0,
        total_weekly_summaries: weeklySummaries?.length || 0,
      },
    };

    // Return as JSON with download headers
    return NextResponse.json(exportData, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="nextbestmove-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}

