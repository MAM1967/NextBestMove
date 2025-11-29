import type { SupabaseClient } from "@supabase/supabase-js";
import { getCapacityForDate } from "@/lib/calendar/capacity";

type CapacityLevel = "micro" | "light" | "standard" | "heavy" | "default";

interface ActionWithScore {
  action: any;
  score: number;
  isFastWinCandidate: boolean;
}

// Calculate capacity based on free minutes (defaults to standard if no calendar)
function calculateCapacity(freeMinutes: number | null): {
  level: CapacityLevel;
  actionCount: number;
} {
  if (freeMinutes === null) {
    return { level: "default", actionCount: 6 }; // Default: 5-6 actions
  }

  if (freeMinutes < 30) {
    return { level: "micro", actionCount: 2 };
  } else if (freeMinutes < 60) {
    return { level: "light", actionCount: 4 };
  } else if (freeMinutes < 120) {
    return { level: "standard", actionCount: 6 };
  } else {
    return { level: "heavy", actionCount: 8 };
  }
}

// Calculate priority score for an action
function calculatePriorityScore(action: any): number {
  let score = 0;

  // State-based scoring (highest priority first)
  if (action.state === "REPLIED") {
    score += 1000; // Highest priority - next action after reply
  } else if (action.state === "SNOOZED" && action.snooze_until) {
    const snoozeDate = new Date(action.snooze_until);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (snoozeDate <= today) {
      score += 800; // Snoozed action now due
    }
  }

  // Action type scoring
  switch (action.action_type) {
    case "FOLLOW_UP":
      score += 500;
      // Boost if due today or in past
      const dueDate = new Date(action.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor(
        (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff === 0) {
        score += 200; // Due today
      } else if (daysDiff > 0 && daysDiff <= 3) {
        score += 100; // Overdue by 1-3 days
      }
      break;
    case "OUTREACH":
      score += 300;
      break;
    case "NURTURE":
      score += 200;
      break;
    case "CONTENT":
      score += 100;
      break;
    case "CALL_PREP":
      score += 400;
      break;
    case "POST_CALL":
      score += 450;
      break;
  }

  // Boost for actions with person_pins (more context)
  if (action.person_pins) {
    score += 50;
  }

  return score;
}

// Check if action is a Fast Win candidate
function isFastWinCandidate(action: any): boolean {
  // Fast Win criteria:
  // 1. Can be done in <5 minutes
  // 2. High probability of impact

  // Respond to recent reply (<24h) - highest priority
  if (action.state === "REPLIED") {
    return true;
  }

  // Snoozed FOLLOW_UP now due
  if (
    action.state === "SNOOZED" &&
    action.action_type === "FOLLOW_UP" &&
    action.snooze_until
  ) {
    const snoozeDate = new Date(action.snooze_until);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (snoozeDate <= today) {
      return true;
    }
  }

  // FOLLOW_UP on warm thread (simple, quick)
  if (action.action_type === "FOLLOW_UP" && action.state === "NEW") {
    return true;
  }

  // Simple nurture touch
  if (action.action_type === "NURTURE") {
    return true;
  }

  // Light OUTREACH to recently pinned person
  if (action.action_type === "OUTREACH" && action.person_pins) {
    return true;
  }

  return false;
}

/**
 * Generate a daily plan for a specific user and date.
 * This function can be called from both authenticated endpoints and cron jobs.
 */
export async function generateDailyPlanForUser(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<{ success: boolean; error?: string; dailyPlan?: any }> {
  try {
    // Check if plan already exists for this date
    const { data: existingPlan } = await supabase
      .from("daily_plans")
      .select("id")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();

    if (existingPlan) {
      return { success: false, error: "Plan already exists for this date" };
    }

    // Check if date is a weekend and user excludes weekends
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Get user preference for weekends
    const { data: userProfile } = await supabase
      .from("users")
      .select("exclude_weekends")
      .eq("id", userId)
      .single();

    const excludeWeekends = userProfile?.exclude_weekends ?? false;

    // If weekend and user excludes weekends, skip
    if (isWeekend && excludeWeekends) {
      return { success: false, error: "Weekends are excluded from daily plan generation" };
    }

    // Calculate capacity from calendar (or use default)
    const capacityInfo = await getCapacityForDate(supabase, userId, date);
    const capacityLevel = capacityInfo.level;
    const actionCount = capacityInfo.actionsPerDay;

    // For backward compatibility, calculate freeMinutes (approximate)
    let freeMinutes: number | null = null;
    if (capacityInfo.source === "calendar") {
      // Approximate: capacity levels map to free minutes ranges
      if (capacityLevel === "micro") freeMinutes = 15;
      else if (capacityLevel === "light") freeMinutes = 45;
      else if (capacityLevel === "standard") freeMinutes = 90;
      else if (capacityLevel === "heavy") freeMinutes = 240;
    }

    // Fetch candidate actions (NEW or SNOOZED due today or in past)
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);

    // Fetch all candidate actions
    const { data: allCandidateActions, error: actionsError } = await supabase
      .from("actions")
      .select(
        `
        *,
        person_pins (
          id,
          name,
          url,
          notes,
          created_at
        )
      `
      )
      .eq("user_id", userId)
      .in("state", ["NEW", "SNOOZED"])
      .lte("due_date", date)
      .order("due_date", { ascending: true })
      .order("created_at", { ascending: false });

    if (actionsError) {
      console.error("Error fetching candidate actions:", actionsError);
      return { success: false, error: "Failed to fetch candidate actions" };
    }

    // Filter SNOOZED actions: only include if snooze_until <= date or is NULL
    const candidateActions = (allCandidateActions || []).filter((action) => {
      if (action.state === "NEW") {
        return true;
      }
      if (action.state === "SNOOZED") {
        // Include if snooze_until is null or <= date
        if (!action.snooze_until) {
          return true;
        }
        const snoozeDate = new Date(action.snooze_until);
        snoozeDate.setHours(0, 0, 0, 0);
        return snoozeDate <= today;
      }
      return false;
    });

    if (!candidateActions || candidateActions.length === 0) {
      return { success: false, error: "No candidate actions available for plan generation" };
    }

    // Score and sort actions
    const actionsWithScores: ActionWithScore[] = candidateActions.map(
      (action) => ({
        action,
        score: calculatePriorityScore(action),
        isFastWinCandidate: isFastWinCandidate(action),
      })
    );

    // Sort by score (descending)
    actionsWithScores.sort((a, b) => b.score - a.score);

    // Select Fast Win (first fast win candidate)
    let fastWin: ActionWithScore | null = null;
    const fastWinIndex = actionsWithScores.findIndex(
      (a) => a.isFastWinCandidate
    );
    if (fastWinIndex >= 0) {
      fastWin = actionsWithScores[fastWinIndex];
      actionsWithScores.splice(fastWinIndex, 1);
    }

    // Select remaining actions up to capacity
    const selectedActions = actionsWithScores.slice(0, actionCount - 1); // -1 because fast win counts

    // Get weekly focus statement (if available)
    // TODO: Fetch from weekly_summaries table
    const focusStatement = null;

    // Create daily_plan record
    const { data: dailyPlan, error: planError } = await supabase
      .from("daily_plans")
      .insert({
        user_id: userId,
        date,
        focus_statement: focusStatement,
        capacity: capacityLevel,
        free_minutes: freeMinutes,
      })
      .select()
      .single();

    if (planError) {
      console.error("Error creating daily plan:", planError);
      return { success: false, error: "Failed to create daily plan" };
    }

    // Create daily_plan_actions records
    const planActions = [];
    let position = 0;

    // Add Fast Win first (position 0)
    if (fastWin) {
      planActions.push({
        daily_plan_id: dailyPlan.id,
        action_id: fastWin.action.id,
        position: position++,
        is_fast_win: true,
      });
    }

    // Add regular actions
    for (const actionWithScore of selectedActions) {
      planActions.push({
        daily_plan_id: dailyPlan.id,
        action_id: actionWithScore.action.id,
        position: position++,
        is_fast_win: false,
      });
    }

    if (planActions.length > 0) {
      const { error: planActionsError } = await supabase
        .from("daily_plan_actions")
        .insert(planActions);

      if (planActionsError) {
        console.error("Error creating plan actions:", planActionsError);
        // Rollback: delete the daily_plan
        await supabase.from("daily_plans").delete().eq("id", dailyPlan.id);
        return { success: false, error: "Failed to create plan actions" };
      }
    }

    return {
      success: true,
      dailyPlan: {
        ...dailyPlan,
        actionCount: planActions.length,
      },
    };
  } catch (error) {
    console.error("Unexpected error generating plan:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
}

