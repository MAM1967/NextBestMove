import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSubscriptionInfo } from "@/lib/billing/subscription";
import { logError } from "@/lib/utils/logger";

/**
 * GET /api/performance-timeline
 * 
 * Fetch performance timeline data for Premium users.
 * 
 * Query Parameters:
 * - startDate (optional): ISO date string, default: 30 days ago
 * - endDate (optional): ISO date string, default: today
 * - granularity (optional): "day" | "week" | "month", default: "day"
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

    // Check if user has Premium
    const subscription = await getSubscriptionInfo(user.id);
    const isPremium =
      subscription.plan === "premium" &&
      (subscription.status === "active" || subscription.status === "trialing") &&
      !subscription.isReadOnly;

    if (!isPremium) {
      return NextResponse.json(
        {
          error: "Upgrade required",
          code: "UPGRADE_REQUIRED",
          message: "Performance Timeline is a Premium feature",
        },
        { status: 402 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const granularity = searchParams.get("granularity") || "day";

    // Validate granularity
    if (!["day", "week", "month"].includes(granularity)) {
      return NextResponse.json(
        { error: "Invalid granularity. Must be 'day', 'week', or 'month'" },
        { status: 400 }
      );
    }

    // Calculate date range
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const endDate = endDateParam
      ? new Date(endDateParam)
      : new Date(today);
    endDate.setUTCHours(23, 59, 59, 999);

    const defaultStartDate = new Date(today);
    defaultStartDate.setUTCDate(today.getUTCDate() - 30);
    const startDate = startDateParam
      ? new Date(startDateParam)
      : defaultStartDate;
    startDate.setUTCHours(0, 0, 0, 0);

    if (startDate > endDate) {
      return NextResponse.json(
        { error: "startDate must be before endDate" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Fetch timeline data for the date range
    const { data: timelineData, error: fetchError } = await adminClient
      .from("performance_timeline_data")
      .select("date, metrics")
      .eq("user_id", user.id)
      .gte("date", startDate.toISOString().split("T")[0])
      .lte("date", endDate.toISOString().split("T")[0])
      .order("date", { ascending: true });

    if (fetchError) {
      logError("Failed to fetch performance timeline data", fetchError);
      return NextResponse.json(
        {
          error: "Failed to fetch timeline data",
          details: fetchError.message,
        },
        { status: 500 }
      );
    }

    // Aggregate data based on granularity
    const aggregatedData = aggregateByGranularity(
      timelineData || [],
      granularity as "day" | "week" | "month"
    );

    // Calculate summary statistics
    const summary = calculateSummary(aggregatedData);

    return NextResponse.json({
      success: true,
      data: aggregatedData,
      summary,
      dateRange: {
        start: startDate.toISOString().split("T")[0],
        end: endDate.toISOString().split("T")[0],
      },
      granularity,
    });
  } catch (error) {
    logError("Failed to fetch performance timeline", error);
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
 * Aggregate timeline data by granularity (day, week, or month)
 */
function aggregateByGranularity(
  data: Array<{ date: string; metrics: Record<string, unknown> }>,
  granularity: "day" | "week" | "month"
): Array<{ date: string; metrics: Record<string, unknown> }> {
  if (granularity === "day") {
    return data;
  }

  const grouped = new Map<string, Array<{ date: string; metrics: Record<string, unknown> }>>();

  for (const item of data) {
    const date = new Date(item.date);
    let key: string;

    if (granularity === "week") {
      // Get week start (Monday)
      const dayOfWeek = date.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - daysToMonday);
      key = weekStart.toISOString().split("T")[0];
    } else {
      // Month
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item);
  }

  // Aggregate metrics for each group
  const aggregated: Array<{ date: string; metrics: Record<string, unknown> }> = [];

  for (const [key, items] of grouped.entries()) {
    const aggregatedMetrics = {
      actions_completed: 0,
      actions_created: 0,
      replies_received: 0,
      pins_created: 0,
      pins_archived: 0,
      streak_day: 0,
      completion_rate: 0,
      reply_rate: 0,
    };

    let totalCompletionRate = 0;
    let totalReplyRate = 0;
    let validCompletionRates = 0;
    let validReplyRates = 0;

    for (const item of items) {
      const metrics = item.metrics;
      aggregatedMetrics.actions_completed += metrics.actions_completed || 0;
      aggregatedMetrics.actions_created += metrics.actions_created || 0;
      aggregatedMetrics.replies_received += metrics.replies_received || 0;
      aggregatedMetrics.pins_created += metrics.pins_created || 0;
      aggregatedMetrics.pins_archived += metrics.pins_archived || 0;
      aggregatedMetrics.streak_day = Math.max(
        aggregatedMetrics.streak_day,
        metrics.streak_day || 0
      );

      if (metrics.completion_rate !== undefined && metrics.completion_rate !== null) {
        totalCompletionRate += metrics.completion_rate;
        validCompletionRates++;
      }

      if (metrics.reply_rate !== undefined && metrics.reply_rate !== null) {
        totalReplyRate += metrics.reply_rate;
        validReplyRates++;
      }
    }

    aggregatedMetrics.completion_rate =
      validCompletionRates > 0
        ? Math.round((totalCompletionRate / validCompletionRates) * 100) / 100
        : 0;
    aggregatedMetrics.reply_rate =
      validReplyRates > 0
        ? Math.round((totalReplyRate / validReplyRates) * 100) / 100
        : 0;

    aggregated.push({
      date: key,
      metrics: aggregatedMetrics,
    });
  }

  return aggregated.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate summary statistics from timeline data
 */
function calculateSummary(
  data: Array<{ date: string; metrics: Record<string, unknown> }>
): {
  total_days: number;
  avg_completion_rate: number;
  avg_reply_rate: number;
  total_actions_completed: number;
  total_replies_received: number;
} {
  if (data.length === 0) {
    return {
      total_days: 0,
      avg_completion_rate: 0,
      avg_reply_rate: 0,
      total_actions_completed: 0,
      total_replies_received: 0,
    };
  }

  let totalActionsCompleted = 0;
  let totalRepliesReceived = 0;
  let totalCompletionRate = 0;
  let totalReplyRate = 0;
  let validCompletionRates = 0;
  let validReplyRates = 0;

  for (const item of data) {
    const metrics = item.metrics;
    totalActionsCompleted += metrics.actions_completed || 0;
    totalRepliesReceived += metrics.replies_received || 0;

    if (metrics.completion_rate !== undefined && metrics.completion_rate !== null) {
      totalCompletionRate += metrics.completion_rate;
      validCompletionRates++;
    }

    if (metrics.reply_rate !== undefined && metrics.reply_rate !== null) {
      totalReplyRate += metrics.reply_rate;
      validReplyRates++;
    }
  }

  return {
    total_days: data.length,
    avg_completion_rate:
      validCompletionRates > 0
        ? Math.round((totalCompletionRate / validCompletionRates) * 100) / 100
        : 0,
    avg_reply_rate:
      validReplyRates > 0
        ? Math.round((totalReplyRate / validReplyRates) * 100) / 100
        : 0,
    total_actions_completed: totalActionsCompleted,
    total_replies_received: totalRepliesReceived,
  };
}

