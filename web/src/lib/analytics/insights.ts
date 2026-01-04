import type { SupabaseClient } from "@supabase/supabase-js";

export type InsightType =
  | "deal_progression"
  | "response_time"
  | "conversion_rate"
  | "best_days"
  | "channel_effectiveness"
  | "relationship_health";

export interface InsightData {
  type: InsightType;
  title: string;
  description: string;
  data: Record<string, unknown>;
  periodStart: string;
  periodEnd: string;
}

/**
 * Generate additional insights beyond weekly summaries.
 */
export async function generateInsights(
  supabase: SupabaseClient,
  userId: string,
  periodStart: string,
  periodEnd: string
): Promise<InsightData[]> {
  const insights: InsightData[] = [];

  // 1. Response time trends
  const responseTimeInsight = await calculateResponseTimeInsight(
    supabase,
    userId,
    periodStart,
    periodEnd
  );
  if (responseTimeInsight) {
    insights.push(responseTimeInsight);
  }

  // 2. Best days/times for outreach
  const bestDaysInsight = await calculateBestDaysInsight(
    supabase,
    userId,
    periodStart,
    periodEnd
  );
  if (bestDaysInsight) {
    insights.push(bestDaysInsight);
  }

  // 3. Channel effectiveness
  const channelInsight = await calculateChannelEffectiveness(
    supabase,
    userId,
    periodStart,
    periodEnd
  );
  if (channelInsight) {
    insights.push(channelInsight);
  }

  return insights;
}

async function calculateResponseTimeInsight(
  supabase: SupabaseClient,
  userId: string,
  periodStart: string,
  periodEnd: string
): Promise<InsightData | null> {
  // Get actions that were replied to
  const { data: actions } = await supabase
    .from("actions")
    .select("created_at, updated_at, state")
    .eq("user_id", userId)
    .eq("state", "REPLIED")
    .gte("created_at", periodStart)
    .lte("created_at", periodEnd);

  if (!actions || actions.length === 0) {
    return null;
  }

  // Calculate average time to reply (simplified)
  const responseTimes: number[] = [];
  actions.forEach((action) => {
    const created = new Date(action.created_at).getTime();
    const updated = new Date(action.updated_at).getTime();
    const hours = (updated - created) / (1000 * 60 * 60);
    if (hours > 0 && hours < 168) {
      // Within a week
      responseTimes.push(hours);
    }
  });

  if (responseTimes.length === 0) {
    return null;
  }

  const avgHours = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const avgDays = avgHours / 24;

  const improvement =
    responseTimes.length > 1
      ? responseTimes[0] > responseTimes[responseTimes.length - 1]
      : false;

  return {
    type: "response_time",
    title: "Response Time",
    description: improvement
      ? `Your average response time improved to ${avgDays.toFixed(1)} days`
      : `Your average response time is ${avgDays.toFixed(1)} days`,
    data: {
      averageHours: avgHours,
      averageDays: avgDays,
      sampleSize: responseTimes.length,
      improvement,
    },
    periodStart,
    periodEnd,
  };
}

async function calculateBestDaysInsight(
  supabase: SupabaseClient,
  userId: string,
  periodStart: string,
  periodEnd: string
): Promise<InsightData | null> {
  // Get actions that were replied to, grouped by day of week
  const { data: actions } = await supabase
    .from("actions")
    .select("created_at, state")
    .eq("user_id", userId)
    .eq("state", "REPLIED")
    .gte("created_at", periodStart)
    .lte("created_at", periodEnd);

  if (!actions || actions.length === 0) {
    return null;
  }

  const dayCounts: Record<string, number> = {};
  actions.forEach((action) => {
    const day = new Date(action.created_at).toLocaleDateString("en-US", {
      weekday: "long",
    });
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });

  const bestDay = Object.entries(dayCounts).reduce((a, b) =>
    b[1] > a[1] ? b : a
  );

  return {
    type: "best_days",
    title: "Best Days for Outreach",
    description: `${bestDay[0]}s are your best day for replies (${bestDay[1]} replies)`,
    data: {
      bestDay: bestDay[0],
      replyCount: bestDay[1],
      dayBreakdown: dayCounts,
    },
    periodStart,
    periodEnd,
  };
}

async function calculateChannelEffectiveness(
  supabase: SupabaseClient,
  userId: string,
  periodStart: string,
  periodEnd: string
): Promise<InsightData | null> {
  // Get actions with preferred channel from leads
  const { data: actions } = await supabase
    .from("actions")
    .select(
      `
      id,
      state,
      leads!inner(preferred_channel)
    `
    )
    .eq("user_id", userId)
    .eq("state", "REPLIED")
    .gte("created_at", periodStart)
    .lte("created_at", periodEnd);

  if (!actions || actions.length === 0) {
    return null;
  }

  const channelCounts: Record<string, number> = {};
  actions.forEach((action) => {
    const lead = action.leads as { preferred_channel?: string } | null;
    const channel = lead?.preferred_channel || "unknown";
    channelCounts[channel] = (channelCounts[channel] || 0) + 1;
  });

  const bestChannel = Object.entries(channelCounts).reduce((a, b) =>
    b[1] > a[1] ? b : a
  );

  return {
    type: "channel_effectiveness",
    title: "Channel Effectiveness",
    description: `${bestChannel[0]} is your most effective channel (${bestChannel[1]} replies)`,
    data: {
      bestChannel: bestChannel[0],
      replyCount: bestChannel[1],
      channelBreakdown: channelCounts,
    },
    periodStart,
    periodEnd,
  };
}

/**
 * Store insights in database.
 */
export async function storeInsights(
  supabase: SupabaseClient,
  userId: string,
  insights: InsightData[]
): Promise<void> {
  for (const insight of insights) {
    await supabase.from("analytics_insights").upsert(
      {
        user_id: userId,
        insight_type: insight.type,
        insight_data: insight.data,
        period_start: insight.periodStart,
        period_end: insight.periodEnd,
      },
      {
        onConflict: "user_id,insight_type,period_start",
      }
    );
  }
}

