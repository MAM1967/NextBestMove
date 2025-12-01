import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/cron/auto-unsnooze
 * 
 * Cron job to automatically unsnooze items (pins and actions) that have
 * reached their snooze_until date.
 * Runs daily at midnight UTC.
 * 
 * Note: There's also a database trigger that handles this on INSERT/UPDATE,
 * but this cron ensures it runs even if no actions are touched.
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
    const today = new Date().toISOString().split("T")[0];

    // Auto-unsnooze person_pins
    const { data: unsnoozedPins, error: pinsError } = await adminClient
      .from("person_pins")
      .update({ status: "ACTIVE", snooze_until: null })
      .eq("status", "SNOOZED")
      .not("snooze_until", "is", null)
      .lte("snooze_until", today)
      .select("id");

    if (pinsError) {
      console.error("Error unsnoozing pins:", pinsError);
    }

    // Auto-unsnooze actions
    const { data: unsnoozedActions, error: actionsError } = await adminClient
      .from("actions")
      .update({ state: "NEW", snooze_until: null })
      .eq("state", "SNOOZED")
      .not("snooze_until", "is", null)
      .lte("snooze_until", today)
      .select("id");

    if (actionsError) {
      console.error("Error unsnoozing actions:", actionsError);
    }

    return NextResponse.json({
      success: true,
      date: today,
      unsnoozedPins: unsnoozedPins?.length || 0,
      unsnoozedActions: unsnoozedActions?.length || 0,
      errors: {
        pins: pinsError?.message,
        actions: actionsError?.message,
      },
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

