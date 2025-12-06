import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateDailyPlanForUser } from "@/lib/plans/generate-daily-plan";

/**
 * GET /api/cron/daily-plans
 * 
 * Cron job to generate daily plans for all active users.
 * Runs daily at 6 AM UTC (adjusts to user's timezone via their preference).
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
    const cronSecret = process.env.CRON_SECRET?.trim().replace(/\r?\n/g, '');
    const cronJobOrgApiKey = process.env.CRON_JOB_ORG_API_KEY?.trim().replace(/\r?\n/g, '');
    
    // Debug logging for staging (to diagnose authorization issues)
    const hostname = new URL(request.url).hostname;
    const isStaging = hostname === "staging.nextbestmove.app" || hostname?.endsWith(".vercel.app");
    if (isStaging) {
      console.log("[Cron Daily Plans] Auth Debug:", {
        hasAuthHeader: !!authHeader,
        authHeaderLength: authHeader?.length || 0,
        authHeaderPrefix: authHeader?.substring(0, 30) || "none",
        hasQuerySecret: !!querySecret,
        querySecretLength: querySecret?.length || 0,
        hasCronSecret: !!cronSecret,
        cronSecretLength: cronSecret?.length || 0,
        hasCronJobOrgApiKey: !!cronJobOrgApiKey,
        cronJobOrgApiKeyLength: cronJobOrgApiKey?.length || 0,
      });
    }
    
    // Check Authorization header (Vercel Cron secret or cron-job.org API key), then query param (cron-job.org secret)
    const isAuthorized = (
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      (cronJobOrgApiKey && authHeader === `Bearer ${cronJobOrgApiKey}`) ||
      (cronSecret && querySecret === cronSecret)
    );
    
    if (!isAuthorized) {
      if (isStaging) {
        console.log("[Cron Daily Plans] Authorization failed:", {
          authHeaderMatchesCronSecret: cronSecret ? authHeader === `Bearer ${cronSecret}` : false,
          authHeaderMatchesApiKey: cronJobOrgApiKey ? authHeader === `Bearer ${cronJobOrgApiKey}` : false,
          querySecretMatches: cronSecret ? querySecret === cronSecret : false,
        });
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const today = new Date().toISOString().split("T")[0];

    // Get all active users (users with active subscriptions or in trial)
    // For MVP, generate for all users (we can filter by subscription later)
    const { data: users, error: usersError } = await adminClient
      .from("users")
      .select("id, timezone, exclude_weekends")
      .order("created_at", { ascending: false });

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users", details: usersError.message },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "No users found",
        generated: 0 
      });
    }

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const errors: Array<{ userId: string; error: string }> = [];

    // Generate plans for each user
    for (const user of users) {
      try {
        const result = await generateDailyPlanForUser(adminClient, user.id, today);
        
        if (!result.success) {
          // Skip if plan already exists or weekend excluded (not an error)
          if (result.error?.includes("already exists") || result.error?.includes("Weekends are excluded")) {
            skippedCount++;
            continue;
          }
          errorCount++;
          errors.push({ userId: user.id, error: result.error || "Unknown error" });
        } else {
          successCount++;
        }
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({ userId: user.id, error: errorMessage });
        console.error(`Error generating plan for user ${user.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      date: today,
      totalUsers: users.length,
      generated: successCount,
      skipped: skippedCount,
      errors: errorCount,
      errorDetails: errors.length > 0 ? errors : undefined,
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

