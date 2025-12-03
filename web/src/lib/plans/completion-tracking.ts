import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Calculate completion rate for a specific daily plan
 * Returns percentage (0-100) of actions completed
 */
export async function getPlanCompletionRate(
  supabase: SupabaseClient,
  dailyPlanId: string
): Promise<number> {
  // Get all actions in the plan
  const { data: planActions } = await supabase
    .from("daily_plan_actions")
    .select("action_id")
    .eq("daily_plan_id", dailyPlanId);

  if (!planActions || planActions.length === 0) {
    return 0;
  }

  // Get the plan date to check completion
  const { data: plan } = await supabase
    .from("daily_plans")
    .select("date")
    .eq("id", dailyPlanId)
    .single();

  if (!plan) {
    return 0;
  }

  const planDate = plan.date;

  // Check how many actions were completed on the plan date
  const actionIds = planActions.map((pa) => pa.action_id);
  const { data: actions } = await supabase
    .from("actions")
    .select("id, completed_at, state")
    .in("id", actionIds);

  if (!actions) {
    return 0;
  }

  // Count completed actions (completed_at matches plan date OR state is DONE/REPLIED)
  const completedCount = actions.filter((action) => {
    if (action.completed_at) {
      const completedDate = new Date(action.completed_at).toISOString().split("T")[0];
      return completedDate === planDate;
    }
    // Also count if state is DONE or REPLIED (completed)
    return action.state === "DONE" || action.state === "REPLIED";
  }).length;

  return Math.round((completedCount / actions.length) * 100);
}

/**
 * Get completion history for a user (last N days)
 * Returns array of completion rates for recent plans
 */
export async function getCompletionHistory(
  supabase: SupabaseClient,
  userId: string,
  days: number = 7,
  excludeToday: boolean = false
): Promise<Array<{ date: string; completionRate: number }>> {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days);

  // Get all plans in the date range (exclude today if requested)
  const todayStr = today.toISOString().split("T")[0];
  let query = supabase
    .from("daily_plans")
    .select("id, date")
    .eq("user_id", userId)
    .gte("date", startDate.toISOString().split("T")[0])
    .lte("date", todayStr)
    .order("date", { ascending: false });
  
  if (excludeToday) {
    query = query.neq("date", todayStr);
  }
  
  const { data: plans } = await query;

  if (!plans || plans.length === 0) {
    return [];
  }

  // Calculate completion rate for each plan
  const history = await Promise.all(
    plans.map(async (plan) => {
      const completionRate = await getPlanCompletionRate(supabase, plan.id);
      return {
        date: plan.date,
        completionRate,
      };
    })
  );

  return history;
}

/**
 * Detect if user has low completion pattern (3+ days < 50%)
 */
export async function hasLowCompletionPattern(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const history = await getCompletionHistory(supabase, userId, 7);
  
  if (history.length < 3) {
    return false;
  }

  // Check last 3 days
  const last3Days = history.slice(0, 3);
  const lowCompletionDays = last3Days.filter((day) => day.completionRate < 50).length;

  return lowCompletionDays >= 3;
}

/**
 * Detect if user has high completion streak (7+ days > 80%)
 */
export async function hasHighCompletionStreak(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  // Exclude today's plan from streak check (it hasn't been completed yet)
  const history = await getCompletionHistory(supabase, userId, 7, true);
  
  if (history.length < 7) {
    return false;
  }

  // Check last 7 days (excluding today)
  const last7Days = history.slice(0, 7);
  const highCompletionDays = last7Days.filter((day) => day.completionRate >= 80).length;

  return highCompletionDays >= 7;
}

/**
 * Get days since last action (for streak break detection)
 * Returns number of days inactive, or null if user has never completed an action
 */
export async function getDaysSinceLastAction(
  supabase: SupabaseClient,
  userId: string
): Promise<number | null> {
  const { data: user } = await supabase
    .from("users")
    .select("last_action_date, created_at")
    .eq("id", userId)
    .single();

  if (!user) {
    return null;
  }

  if (user.last_action_date) {
    const lastActionDate = new Date(user.last_action_date);
    const daysSinceLastAction = Math.floor(
      (Date.now() - lastActionDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceLastAction;
  }

  // No last action date means user has never completed an action
  // Check account creation date
  if (user.created_at) {
    const createdDate = new Date(user.created_at);
    const daysSinceCreation = Math.floor(
      (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceCreation;
  }

  return null;
}

/**
 * Check if user has been inactive for 2-6 days (Day 2-6 streak break recovery)
 */
export async function isInactive2To6Days(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const daysInactive = await getDaysSinceLastAction(supabase, userId);
  if (daysInactive === null) {
    return false;
  }
  return daysInactive >= 2 && daysInactive < 7;
}

/**
 * Check if user has been inactive for 7+ days
 */
export async function isInactive7PlusDays(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const daysInactive = await getDaysSinceLastAction(supabase, userId);
  if (daysInactive === null) {
    return false;
  }
  return daysInactive >= 7;
}

