import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  UserPattern,
  DayOfWeekPattern,
  FollowUpTimingPattern,
  ActionTypeConversionPattern,
  WarmReengagementPattern,
} from "./types";

/**
 * Core SQL-based pattern detection for a user.
 * This does NOT call AI; it only calculates structured pattern data.
 */
export async function detectUserPatterns(
  supabase: SupabaseClient,
  userId: string
): Promise<UserPattern[]> {
  const patterns: UserPattern[] = [];

  const [dayOfWeek, followUpTiming, actionTypeConversion, warmReengagement] =
    await Promise.all([
      detectDayOfWeekPattern(supabase, userId),
      detectFollowUpTimingPattern(supabase, userId),
      detectActionTypeConversionPattern(supabase, userId),
      detectWarmReengagementPattern(supabase, userId),
    ]);

  if (dayOfWeek) patterns.push(dayOfWeek);
  if (followUpTiming) patterns.push(followUpTiming);
  if (actionTypeConversion) patterns.push(actionTypeConversion);
  if (warmReengagement) patterns.push(warmReengagement);

  return patterns;
}

async function detectDayOfWeekPattern(
  supabase: SupabaseClient,
  userId: string
): Promise<DayOfWeekPattern | null> {
  const { data, error } = await supabase.rpc("detect_day_of_week_pattern", {
    p_user_id: userId,
  });

  if (error || !data || data.length === 0) {
    return null;
  }

  const bestDays = data
    .filter((row: any) => row.is_best)
    .map((row: any) => ({
      day: row.day_of_week as string,
      replyRate: Number(row.reply_rate) || 0,
    }));

  const worstDays = data
    .filter((row: any) => row.is_worst)
    .map((row: any) => ({
      day: row.day_of_week as string,
      replyRate: Number(row.reply_rate) || 0,
    }));

  if (bestDays.length === 0 && worstDays.length === 0) {
    return null;
  }

  return {
    type: "day_of_week_performance",
    data: { bestDays, worstDays },
    insight: "",
    confidence: 0.8,
  };
}

async function detectFollowUpTimingPattern(
  supabase: SupabaseClient,
  userId: string
): Promise<FollowUpTimingPattern | null> {
  const { data, error } = await supabase.rpc("detect_follow_up_timing_pattern", {
    p_user_id: userId,
  });

  if (error || !data || data.length === 0) {
    return null;
  }

  const buckets = data.map((row: any) => ({
    label: row.bucket_label as string,
    hoursMin: Number(row.hours_min) || 0,
    hoursMax: row.hours_max !== null ? Number(row.hours_max) : null,
    replyRate: Number(row.reply_rate) || 0,
  }));

  return {
    type: "follow_up_timing",
    data: { buckets },
    insight: "",
    confidence: 0.75,
  };
}

async function detectActionTypeConversionPattern(
  supabase: SupabaseClient,
  userId: string
): Promise<ActionTypeConversionPattern | null> {
  const { data, error } = await supabase.rpc(
    "detect_action_type_conversion_pattern",
    { p_user_id: userId }
  );

  if (error || !data || data.length === 0) {
    return null;
  }

  const entries = data.map((row: any) => ({
    actionType: row.action_type as string,
    replyRate: Number(row.reply_rate) || 0,
  }));

  return {
    type: "action_type_conversion",
    data: { entries },
    insight: "",
    confidence: 0.7,
  };
}

async function detectWarmReengagementPattern(
  supabase: SupabaseClient,
  userId: string
): Promise<WarmReengagementPattern | null> {
  const { data, error } = await supabase.rpc(
    "detect_warm_reengagement_pattern",
    { p_user_id: userId }
  );

  if (error || !data) {
    return null;
  }

  const reengagedCount = Number(data.reengaged_count) || 0;
  const successRate = Number(data.success_rate) || 0;

  if (reengagedCount === 0) {
    return null;
  }

  return {
    type: "warm_reengagement",
    data: { reengagedCount, successRate },
    insight: "",
    confidence: 0.7,
  };
}


