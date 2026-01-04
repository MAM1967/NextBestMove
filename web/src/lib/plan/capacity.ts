import type { SupabaseClient } from "@supabase/supabase-js";
import { getCapacityForDate, type CapacityInfo } from "@/lib/calendar/capacity";

export type CapacityLevel = "micro" | "light" | "standard" | "heavy" | "default";

export interface CapacityOverrideInfo {
  level: CapacityLevel;
  actionCount: number;
  source: "override" | "user_default" | "calendar";
  reason?: string;
}

/**
 * Get capacity for a date, respecting manual overrides.
 * Priority: daily_plans.capacity_override > users.default_capacity_override > calendar-based calculation
 */
export async function getCapacityWithOverrides(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<CapacityOverrideInfo> {
  // 1. Check for daily plan override (highest priority)
  const { data: existingPlan } = await supabase
    .from("daily_plans")
    .select("capacity_override, override_reason")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (existingPlan?.capacity_override) {
    const actionCount = getActionCountForLevel(existingPlan.capacity_override);
    return {
      level: existingPlan.capacity_override as CapacityLevel,
      actionCount,
      source: "override",
      reason: existingPlan.override_reason || undefined,
    };
  }

  // 2. Check for user default override
  const { data: userProfile } = await supabase
    .from("users")
    .select("default_capacity_override")
    .eq("id", userId)
    .single();

  if (userProfile?.default_capacity_override) {
    const actionCount = getActionCountForLevel(
      userProfile.default_capacity_override
    );
    return {
      level: userProfile.default_capacity_override as CapacityLevel,
      actionCount,
      source: "user_default",
    };
  }

  // 3. Fall back to calendar-based calculation
  const calendarCapacity = await getCapacityForDate(supabase, userId, date);
  return {
    level: calendarCapacity.level as CapacityLevel,
    actionCount: calendarCapacity.actionsPerDay,
    source: "calendar",
  };
}

/**
 * Get action count for a given capacity level.
 */
function getActionCountForLevel(
  level: string
): number {
  switch (level) {
    case "micro":
      return 2;
    case "light":
      return 4;
    case "standard":
      return 6;
    case "heavy":
      return 8;
    case "default":
    default:
      return 6;
  }
}

/**
 * Set capacity override for a specific date.
 */
export async function setCapacityOverride(
  supabase: SupabaseClient,
  userId: string,
  date: string,
  capacity: CapacityLevel,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if plan exists
    const { data: existingPlan } = await supabase
      .from("daily_plans")
      .select("id")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();

    if (existingPlan) {
      // Update existing plan
      const { error } = await supabase
        .from("daily_plans")
        .update({
          capacity_override: capacity,
          override_reason: reason || null,
        })
        .eq("id", existingPlan.id);

      if (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Create new plan with override (plan generation will respect this)
      const { error } = await supabase.from("daily_plans").insert({
        user_id: userId,
        date,
        capacity_override: capacity,
        override_reason: reason || null,
        capacity: capacity, // Also set the capacity field for consistency
      });

      if (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Remove capacity override for a specific date.
 */
export async function removeCapacityOverride(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: existingPlan } = await supabase
      .from("daily_plans")
      .select("id")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();

    if (existingPlan) {
      const { error } = await supabase
        .from("daily_plans")
        .update({
          capacity_override: null,
          override_reason: null,
        })
        .eq("id", existingPlan.id);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

