import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/cron/cleanup-stale-actions
 * 
 * Daily cleanup job that archives stale auto-created actions.
 * 
 * Archives actions that are:
 * - Auto-created (auto_created = true)
 * - Overdue by 7+ days
 * - Never interacted with (state = NEW, updated_at = created_at)
 * 
 * This prevents action list from becoming overwhelming when users
 * don't complete auto-generated actions.
 * 
 * Runs daily at 2 AM UTC (via cron-job.org or Vercel cron)
 * 
 * Configuration: Set up in cron-job.org with:
 * - Schedule: 0 2 * * * (daily at 2 AM UTC)
 * - URL: https://nextbestmove.app/api/cron/cleanup-stale-actions
 * - Method: POST
 * - Headers: Authorization: Bearer ${CRON_SECRET}
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret - support Authorization header (Vercel Cron or cron-job.org API key), and query param (cron-job.org)
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET?.trim().replace(/\r?\n/g, '');
    const cronJobOrgApiKey = process.env.CRON_JOB_ORG_API_KEY?.trim().replace(/\r?\n/g, '');
    
    // Check Authorization header (Vercel Cron secret or cron-job.org API key), then query param (cron-job.org secret)
    const isAuthorized = (
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      (cronJobOrgApiKey && authHeader === `Bearer ${cronJobOrgApiKey}`) ||
      (cronSecret && querySecret === cronSecret)
    );
    
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0]; // YYYY-MM-DD format

    // Find stale actions: auto-created, overdue by 7+ days, never interacted with
    // Query actions where:
    // - auto_created = true
    // - state = NEW (never completed or snoozed)
    // - due_date < sevenDaysAgo (overdue by 7+ days)
    // - updated_at = created_at (never modified after creation)
    const { data: staleActions, error: fetchError } = await supabase
      .from("actions")
      .select("id, user_id, action_type, due_date, created_at, updated_at")
      .eq("auto_created", true)
      .eq("state", "NEW")
      .lt("due_date", sevenDaysAgoStr);

    if (fetchError) {
      console.error("Error fetching stale actions:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch stale actions", details: fetchError.message },
        { status: 500 }
      );
    }

    if (!staleActions || staleActions.length === 0) {
      console.log("No stale actions to clean up");
      return NextResponse.json({
        success: true,
        archived: 0,
        message: "No stale actions to clean up",
      });
    }

    // Filter to only actions that were never modified (updated_at = created_at)
    // This ensures we only archive actions the user never interacted with
    const neverInteracted = staleActions.filter((action) => {
      const createdAt = new Date(action.created_at).getTime();
      const updatedAt = new Date(action.updated_at).getTime();
      // Allow 1 second tolerance for timestamp differences
      return Math.abs(updatedAt - createdAt) < 1000;
    });

    if (neverInteracted.length === 0) {
      console.log("No stale actions that were never interacted with");
      return NextResponse.json({
        success: true,
        archived: 0,
        message: "No stale actions that were never interacted with",
      });
    }

    // Archive these actions
    const actionIds = neverInteracted.map((a) => a.id);
    const archivedNote = `Auto-archived: No user interaction within 7 days of due date`;

    const { error: updateError, count } = await supabase
      .from("actions")
      .update({
        state: "ARCHIVED",
        notes: archivedNote,
      })
      .in("id", actionIds)
      .select("id", { count: "exact" });

    if (updateError) {
      console.error("Error archiving stale actions:", updateError);
      return NextResponse.json(
        { error: "Failed to archive stale actions", details: updateError.message },
        { status: 500 }
      );
    }

    console.log(`Successfully archived ${actionIds.length} stale actions`);

    return NextResponse.json({
      success: true,
      archived: actionIds.length,
      message: `Archived ${actionIds.length} stale actions`,
    });
  } catch (error) {
    console.error("Unexpected error in cleanup-stale-actions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Also support GET for manual testing
export async function GET(request: Request) {
  return POST(request);
}

