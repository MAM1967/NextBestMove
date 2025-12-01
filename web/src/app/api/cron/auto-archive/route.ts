import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/cron/auto-archive
 * 
 * Cron job to automatically archive old DONE actions (older than 90 days).
 * Runs daily at 2 AM UTC.
 * 
 * Per PRD Section 18: "Actions in DONE state: Kept 'live' for 90 days, then marked ARCHIVED."
 * 
 * This endpoint is called by Vercel Cron and requires authentication via
 * the Authorization header with a secret token.
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret - support Authorization header (Vercel Cron or cron-job.org API key), and query param (cron-job.org)
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;
    const cronJobOrgApiKey = process.env.CRON_JOB_ORG_API_KEY;
    
    // Check Authorization header (Vercel Cron secret or cron-job.org API key), then query param (cron-job.org secret)
    const isAuthorized = (
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      (cronJobOrgApiKey && authHeader === `Bearer ${cronJobOrgApiKey}`) ||
      (cronSecret && querySecret === cronSecret)
    );
    
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Calculate date 90 days ago
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    ninetyDaysAgo.setHours(0, 0, 0, 0);
    const cutoffDate = ninetyDaysAgo.toISOString();

    // Archive DONE actions older than 90 days
    const { data: archivedActions, error: archiveError } = await adminClient
      .from("actions")
      .update({ state: "ARCHIVED" })
      .eq("state", "DONE")
      .not("completed_at", "is", null)
      .lt("completed_at", cutoffDate)
      .select("id");

    if (archiveError) {
      console.error("Error archiving actions:", archiveError);
      return NextResponse.json(
        { 
          error: "Failed to archive actions",
          details: archiveError.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cutoffDate: cutoffDate,
      archivedActions: archivedActions?.length || 0,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

