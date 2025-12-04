import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/insights/stale-actions
 * 
 * Returns actions that are older than 7 days and remain in NEW state (not snoozed).
 * These are actions that were created but never made it into a daily plan.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Calculate date 7 days ago at start of day (00:00:00) in UTC
    // This ensures consistent comparison with TIMESTAMPTZ in the database
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);

    // Fetch stale actions: NEW state, not snoozed, created more than 7 days ago
    const { data: staleActions, error } = await supabase
      .from("actions")
      .select(
        `
        *,
        leads (
          id,
          name,
          url,
          notes
        )
      `
      )
      .eq("user_id", user.id)
      .eq("state", "NEW")
      .is("snooze_until", null) // Not snoozed
      .lt("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching stale actions:", error);
      return NextResponse.json(
        { error: "Failed to fetch stale actions" },
        { status: 500 }
      );
    }

    // Calculate how many days old each action is
    const actionsWithAge = (staleActions || []).map((action) => {
      const createdDate = new Date(action.created_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysOld = Math.floor(
        (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        ...action,
        days_old: daysOld,
      };
    });

    return NextResponse.json({
      staleActions: actionsWithAge,
      count: actionsWithAge.length,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

