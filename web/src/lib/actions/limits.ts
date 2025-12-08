import { createClient } from "@/lib/supabase/server";

/**
 * Maximum number of pending actions a user can have before new auto-generated actions are skipped
 * Exception: FOLLOW_UP actions are always created (critical revenue driver)
 */
export const MAX_PENDING_ACTIONS = 15;

/**
 * Get the count of pending actions for a user
 * Pending = actions in NEW or SNOOZED state with due_date >= today
 */
export async function getPendingActionCount(userId: string): Promise<number> {
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

    const { count, error } = await supabase
      .from("actions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("state", ["NEW", "SNOOZED"])
      .gte("due_date", today);

    if (error) {
      console.error("Error counting pending actions:", error);
      // Return 0 on error to allow action creation (fail open)
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Unexpected error counting pending actions:", error);
    // Return 0 on error to allow action creation (fail open)
    return 0;
  }
}

/**
 * Check if user has reached the maximum pending actions limit
 * @param userId - User ID to check
 * @param allowCriticalActions - If true, always returns false (allows critical actions like FOLLOW_UP)
 * @returns true if user is at or over limit, false otherwise
 */
export async function isAtActionLimit(
  userId: string,
  allowCriticalActions: boolean = false
): Promise<boolean> {
  if (allowCriticalActions) {
    // Critical actions (FOLLOW_UP) are always allowed
    return false;
  }

  const pendingCount = await getPendingActionCount(userId);
  return pendingCount >= MAX_PENDING_ACTIONS;
}

