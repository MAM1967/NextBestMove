import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generateWeeklySummaryForUser } from "@/lib/summaries/generate-weekly-summary";

/**
 * POST /api/weekly-summaries/generate
 *
 * Generates a weekly summary for a given week.
 * Can be called manually or by a cron job.
 *
 * Query params:
 * - week_start_date (optional): YYYY-MM-DD format, defaults to Monday of current week
 */
export async function POST(request: Request) {
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

    // Calculate week start (Monday)
    let weekStartDate: Date;
    if (weekStartParam) {
      weekStartDate = new Date(weekStartParam);
    } else {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weekStartDate = new Date(today);
      weekStartDate.setDate(today.getDate() - daysToMonday);
    }
    weekStartDate.setHours(0, 0, 0, 0);

    // Use shared generation function
    const result = await generateWeeklySummaryForUser(
      supabase,
      user.id,
      weekStartDate
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to generate summary" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, summary: result.summary });
  } catch (error) {
    console.error("Weekly summary generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
