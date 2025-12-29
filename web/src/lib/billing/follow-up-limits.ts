import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserTier } from "./tier";

export interface FollowUpLimitCheck {
  canCreate: boolean;
  currentCount: number;
  limit: number;
  message?: string;
}

/**
 * Check if user can create a follow-up action based on tier limits
 * Free tier: 3 follow-ups per week
 * Standard/Premium: Unlimited
 * 
 * Week is defined as Monday 00:00 to Sunday 23:59 in user's timezone
 */
export async function checkFollowUpLimit(
  supabase: SupabaseClient,
  userId: string,
  tier: UserTier
): Promise<FollowUpLimitCheck> {
  // Standard and Premium tiers have unlimited follow-ups
  if (tier === "standard" || tier === "premium") {
    return {
      canCreate: true,
      currentCount: 0,
      limit: Infinity,
    };
  }

  // Free tier: 3 follow-ups per week
  const limit = 3;

  // Get user timezone
  const { data: userProfile } = await supabase
    .from("users")
    .select("timezone")
    .eq("id", userId)
    .single();

  const timezone = userProfile?.timezone || "UTC";

  // Calculate week start (Monday 00:00) in user's timezone
  const now = new Date();
  const userNow = new Date(
    now.toLocaleString("en-US", { timeZone: timezone })
  );
  
  // Get Monday of current week
  const dayOfWeek = userNow.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const monday = new Date(userNow);
  
  if (dayOfWeek === 0) {
    // Sunday: go back 6 days to get Monday
    monday.setDate(userNow.getDate() - 6);
  } else {
    // Monday-Saturday: go back (dayOfWeek - 1) days
    monday.setDate(userNow.getDate() - (dayOfWeek - 1));
  }
  
  monday.setHours(0, 0, 0, 0);

  // Calculate week end (Sunday 23:59:59)
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // Convert to ISO strings for database query
  const weekStartISO = monday.toISOString();
  const weekEndISO = sunday.toISOString();

  // Count FOLLOW_UP actions created this week
  const { count, error } = await supabase
    .from("actions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action_type", "FOLLOW_UP")
    .gte("created_at", weekStartISO)
    .lte("created_at", weekEndISO);

  if (error) {
    console.error("Error checking follow-up limit:", error);
    // On error, allow creation (fail open)
    return {
      canCreate: true,
      currentCount: 0,
      limit,
    };
  }

  const currentCount = count || 0;
  const canCreate = currentCount < limit;

  return {
    canCreate,
    currentCount,
    limit,
    message: canCreate
      ? undefined
      : `Free tier allows ${limit} follow-ups per week. Upgrade to Standard for unlimited follow-ups.`,
  };
}

