import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError, logInfo } from "@/lib/utils/logger";

/**
 * GET /api/cron/aggregate-performance-timeline
 * 
 * Cron job to aggregate daily performance metrics for Premium users.
 * Runs daily at 11:59 PM UTC.
 * Aggregates metrics for the previous day.
 * 
 * This endpoint is called by cron-job.org or Vercel Cron and requires authentication.
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret - support both Authorization header (Vercel Cron) and query param (cron-job.org)
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
      logError("Unauthorized cron request", undefined, {
        context: "aggregate_performance_timeline_cron",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Calculate previous day (UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const previousDay = new Date(today);
    previousDay.setUTCDate(today.getUTCDate() - 1);
    const previousDayStr = previousDay.toISOString().split("T")[0];

    logInfo("Performance timeline aggregation started", {
      date: previousDayStr,
      timezone: "UTC",
      context: "aggregate_performance_timeline_cron",
    });

    // Get all Premium users with active subscriptions or trials
    const { data: premiumUsers, error: usersError } = await adminClient
      .from("billing_subscriptions")
      .select(`
        user_id,
        status,
        metadata
      `)
      .in("status", ["active", "trialing"])
      .eq("metadata->>plan_type", "premium");

    if (usersError) {
      logError("Error fetching Premium users", usersError, {
        context: "aggregate_performance_timeline_cron",
      });
      return NextResponse.json(
        { error: "Failed to fetch Premium users", details: usersError.message },
        { status: 500 }
      );
    }

    if (!premiumUsers || premiumUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No Premium users found",
        aggregated: 0,
        date: previousDayStr,
      });
    }

    // Get unique user IDs
    const userIds = [...new Set(premiumUsers.map((sub) => sub.user_id))];

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ userId: string; error: string }> = [];

    // Aggregate metrics for each Premium user
    for (const userId of userIds) {
      try {
        // Calculate metrics for previous day
        const metrics = await calculateDailyMetrics(adminClient, userId, previousDayStr);

        // Upsert into performance_timeline_data
        const { error: upsertError } = await adminClient
          .from("performance_timeline_data")
          .upsert(
            {
              user_id: userId,
              date: previousDayStr,
              metrics: metrics,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id,date",
            }
          );

        if (upsertError) {
          throw new Error(`Failed to upsert: ${upsertError.message}`);
        }

        successCount++;
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        errors.push({ userId, error: errorMessage });
        logError(`Failed to aggregate metrics for user ${userId}`, error, {
          context: "aggregate_performance_timeline_cron",
          userId,
          date: previousDayStr,
        });
      }
    }

    // Clean up old data (keep last 365 days)
    const cutoffDate = new Date(today);
    cutoffDate.setUTCDate(today.getUTCDate() - 365);
    const cutoffDateStr = cutoffDate.toISOString().split("T")[0];

    const { error: deleteError } = await adminClient
      .from("performance_timeline_data")
      .delete()
      .lt("date", cutoffDateStr);

    if (deleteError) {
      logError("Failed to clean up old timeline data", deleteError, {
        context: "aggregate_performance_timeline_cron",
      });
    }

    logInfo("Performance timeline aggregation completed", {
      date: previousDayStr,
      successCount,
      errorCount,
      totalUsers: userIds.length,
      context: "aggregate_performance_timeline_cron",
    });

    return NextResponse.json({
      success: true,
      message: "Performance timeline aggregation completed",
      date: previousDayStr,
      aggregated: successCount,
      errors: errorCount,
      errorDetails: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    logError("Unexpected error in performance timeline aggregation cron", error, {
      context: "aggregate_performance_timeline_cron",
    });
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate daily metrics for a user for a specific date
 */
async function calculateDailyMetrics(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
  dateStr: string
): Promise<Record<string, any>> {
  const date = new Date(dateStr);
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  // Actions completed (state = DONE, REPLIED, SENT)
  const { count: actionsCompleted } = await adminClient
    .from("actions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("state", ["DONE", "REPLIED", "SENT"])
    .gte("completed_at", startOfDay.toISOString())
    .lte("completed_at", endOfDay.toISOString());

  // Actions created
  const { count: actionsCreated } = await adminClient
    .from("actions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfDay.toISOString())
    .lte("created_at", endOfDay.toISOString());

  // Replies received (actions with state = 'REPLIED')
  const { count: repliesReceived } = await adminClient
    .from("actions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("state", "REPLIED")
    .gte("completed_at", startOfDay.toISOString())
    .lte("completed_at", endOfDay.toISOString());

  // Leads created
  const { count: leadsCreated } = await adminClient
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfDay.toISOString())
    .lte("created_at", endOfDay.toISOString());

  // Leads archived
  const { count: leadsArchived } = await adminClient
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "ARCHIVED")
    .gte("updated_at", startOfDay.toISOString())
    .lte("updated_at", endOfDay.toISOString());

  // Get current streak day from user profile
  const { data: user } = await adminClient
    .from("users")
    .select("streak_count")
    .eq("id", userId)
    .single();

  const streakDay = user?.streak_count || 0;

  // Calculate completion rate
  // Note: actionsCompleted includes all actions completed on this day (may be from previous days)
  // actionsCreated only includes actions created on this day
  // We cap at 100% to avoid >100% rates when completing old actions
  const totalActionsForDay = actionsCreated || 0;
  const completionRate =
    totalActionsForDay > 0
      ? Math.min(1.0, (actionsCompleted || 0) / totalActionsForDay)
      : 0;

  // Calculate reply rate (replies / outreach actions)
  // Outreach actions are OUTREACH type actions created on this day
  // repliesReceived includes all replies received on this day (may be from previous days' outreach)
  // We cap at 100% to avoid >100% rates when receiving replies to old outreach
  const { count: outreachActions } = await adminClient
    .from("actions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action_type", "OUTREACH")
    .gte("created_at", startOfDay.toISOString())
    .lte("created_at", endOfDay.toISOString());

  const replyRate =
    (outreachActions || 0) > 0
      ? Math.min(1.0, (repliesReceived || 0) / (outreachActions || 0))
      : 0;

  return {
    actions_completed: actionsCompleted || 0,
    actions_created: actionsCreated || 0,
    replies_received: repliesReceived || 0,
    leads_created: leadsCreated || 0,
    leads_archived: leadsArchived || 0,
    pins_created: leadsCreated || 0, // Legacy field for backward compatibility
    pins_archived: leadsArchived || 0, // Legacy field for backward compatibility
    streak_day: streakDay,
    completion_rate: Math.round(completionRate * 100) / 100, // Round to 2 decimal places
    reply_rate: Math.round(replyRate * 100) / 100, // Round to 2 decimal places
  };
}

