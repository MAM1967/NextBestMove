import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/weekly-summaries
 * 
 * Fetches weekly summaries for the authenticated user.
 * 
 * Query params:
 * - week_start_date (optional): YYYY-MM-DD format, defaults to current week
 * - limit (optional): number of summaries to return, defaults to 1
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weekStartParam = searchParams.get("week_start_date");
    const limitParam = searchParams.get("limit");

    let query = supabase
      .from("weekly_summaries")
      .select("*")
      .eq("user_id", user.id)
      .order("week_start_date", { ascending: false });

    if (weekStartParam) {
      query = query.eq("week_start_date", weekStartParam);
    }

    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      if (!isNaN(limit) && limit > 0) {
        query = query.limit(limit);
      }
    } else {
      query = query.limit(1); // Default to most recent
    }

    const { data: summaries, error } = await query;

    if (error) {
      console.error("Error fetching weekly summaries:", error);
      return NextResponse.json(
        { error: "Failed to fetch weekly summaries" },
        { status: 500 }
      );
    }

    // If no summary found and no specific week requested, try to generate one
    if (!summaries || summaries.length === 0) {
      return NextResponse.json({ summary: null, canGenerate: true });
    }

    // Fetch associated content prompts
    const summaryIds = summaries.map((s) => s.id);
    const { data: prompts } = await supabase
      .from("content_prompts")
      .select("*")
      .in("weekly_summary_id", summaryIds)
      .eq("status", "DRAFT");

    // Attach prompts to summaries
    const summariesWithPrompts = summaries.map((summary) => ({
      ...summary,
      content_prompts: prompts?.filter((p) => p.weekly_summary_id === summary.id) || [],
    }));

    return NextResponse.json({
      summaries: summariesWithPrompts,
      summary: summariesWithPrompts[0], // Most recent
    });
  } catch (error) {
    console.error("Weekly summaries fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
















