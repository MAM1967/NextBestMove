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

    // Calculate week start (previous week's Sunday, matching cron job logic)
    // Previous week = the week that just ended (Sunday-Saturday)
    // Week structure: Sunday (0) - Saturday (6)
    // If today is Sunday, previous week's Sunday is 7 days ago
    // If today is Monday-Saturday, previous week's Sunday is (dayOfWeek + 7) days ago
    let weekStartDate: Date;
    if (weekStartParam) {
      weekStartDate = new Date(weekStartParam);
    } else {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      let daysToPreviousSunday: number;

      if (dayOfWeek === 0) {
        // Sunday: previous week's Sunday is 7 days ago
        daysToPreviousSunday = 7;
      } else {
        // Monday-Saturday: previous week's Sunday is (dayOfWeek + 7) days ago
        // This ensures we go back to the previous week's Sunday, not this week's
        daysToPreviousSunday = dayOfWeek + 7;
      }

      weekStartDate = new Date(today);
      weekStartDate.setDate(today.getDate() - daysToPreviousSunday);
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
