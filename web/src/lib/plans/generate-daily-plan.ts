import type { SupabaseClient } from "@supabase/supabase-js";
import { getCapacityForDate } from "@/lib/calendar/capacity";
import {
  hasLowCompletionPattern,
  isInactive7PlusDays,
  hasHighCompletionStreak,
} from "./completion-tracking";

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
    let capacityInfo = await getCapacityForDate(supabase, userId, date);
    let capacityLevel = capacityInfo.level;
    let actionCount = capacityInfo.actionsPerDay;

    // Adaptive Recovery Logic: Override capacity based on user patterns
    const [lowCompletion, inactive7Plus, highStreak] = await Promise.all([
      hasLowCompletionPattern(supabase, userId),
      isInactive7PlusDays(supabase, userId),
      hasHighCompletionStreak(supabase, userId),
    ]);

    let adaptiveReason: string | null = null;

    // Case 1: 7+ days inactive → Micro plan (1-2 actions)
    if (inactive7Plus) {
      capacityLevel = "micro";
      actionCount = 2;
      adaptiveReason = "comeback";
    }
    // Case 2: Low completion pattern (3+ days < 50%) → Light plan (3-4 actions)
    else if (lowCompletion) {
      capacityLevel = "light";
      actionCount = 3;
      adaptiveReason = "low_completion";
    }
    // Case 3: High completion streak (7+ days > 80%) → Can increase capacity
    else if (highStreak && capacityLevel === "standard") {
      // Boost to heavy if they're consistently completing
      capacityLevel = "heavy";
      actionCount = 8;
      adaptiveReason = "high_streak";
    }

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
    // Parse date string to avoid timezone issues (same fix as client-side)
    const [year, month, day] = date.split('-').map(Number);
    const today = new Date(year, month - 1, day);
    today.setHours(0, 0, 0, 0);

    // Fetch all candidate actions
    // Note: due_date is a DATE column, so .lte("due_date", date) compares DATE to DATE string (YYYY-MM-DD)
    // This should work correctly regardless of timezone since we're comparing date-only values
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
    
    // Log for debugging
    console.log("Plan generation query:", {
      userId,
      date,
      candidateActionsFound: allCandidateActions?.length || 0,
      firstFewActions: allCandidateActions?.slice(0, 3).map(a => ({
        id: a.id,
        state: a.state,
        due_date: a.due_date,
        action_type: a.action_type,
      })) || [],
    });

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
        // Parse snooze date to avoid timezone issues
        const [sYear, sMonth, sDay] = action.snooze_until.split('-').map(Number);
        const snoozeDate = new Date(sYear, sMonth - 1, sDay);
        snoozeDate.setHours(0, 0, 0, 0);
        return snoozeDate <= today;
      }
      return false;
    });

    if (!candidateActions || candidateActions.length === 0) {
      // Get diagnostic info to help debug
      const { data: allActions } = await supabase
        .from("actions")
        .select("id, state, due_date, action_type")
        .eq("user_id", userId)
        .limit(10);
      
      const { data: activePins } = await supabase
        .from("person_pins")
        .select("id, name, status, created_at")
        .eq("user_id", userId)
        .eq("status", "ACTIVE");
      
      // Try to auto-create actions from active pins if no candidate actions exist
      if (activePins && activePins.length > 0) {
        console.log(`No candidate actions found, attempting to create actions from ${activePins.length} active pins`);
        
        // Create OUTREACH actions for active pins that don't have recent actions
        const newActions = [];
        for (const pin of activePins) {
          // Check if pin already has a recent NEW action
          const { data: existingAction } = await supabase
            .from("actions")
            .select("id")
            .eq("user_id", userId)
            .eq("person_id", pin.id)
            .eq("state", "NEW")
            .eq("action_type", "OUTREACH")
            .maybeSingle();
          
          if (!existingAction) {
            // Create a new OUTREACH action for this pin, due today
            const { data: newAction, error: createError } = await supabase
              .from("actions")
              .insert({
                user_id: userId,
                person_id: pin.id,
                action_type: "OUTREACH",
                state: "NEW",
                due_date: date,
                description: `Reach out to ${pin.name}`,
                auto_created: true,
              })
              .select()
              .single();
            
            if (!createError && newAction) {
              // Fetch the full action with person_pins relation
              const { data: fullAction } = await supabase
                .from("actions")
                .select(`
                  *,
                  person_pins (
                    id,
                    name,
                    url,
                    notes,
                    created_at
                  )
                `)
                .eq("id", newAction.id)
                .single();
              
              if (fullAction) {
                newActions.push(fullAction);
              }
            }
          }
        }
        
        // If we created new actions, use them as candidates
        if (newActions.length > 0) {
          console.log(`Created ${newActions.length} new actions from active pins`);
          candidateActions.push(...newActions);
        }
      }
      
      // If still no candidate actions after trying to create from pins
      if (!candidateActions || candidateActions.length === 0) {
        console.error("No candidate actions for plan generation:", {
          userId,
          date,
          totalActions: allActions?.length || 0,
          actionStates: allActions?.map(a => a.state) || [],
          actionDueDates: allActions?.map(a => a.due_date) || [],
          activePins: activePins?.length || 0,
        });
        
        return { 
          success: false, 
          error: "No candidate actions available for plan generation. You need actions with state NEW or SNOOZED that are due today or in the past. If you have active pins, actions should be created automatically." 
        };
      }
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
    let focusStatement: string | null = null;

    // Add adaptive messaging based on recovery reason
    if (adaptiveReason === "comeback") {
      focusStatement = "Welcome back. One small win to restart your momentum.";
    } else if (adaptiveReason === "low_completion") {
      focusStatement = "Let's ease back in — here are your highest-impact moves for today.";
    } else if (adaptiveReason === "high_streak") {
      focusStatement = "You're on a roll! Here's your plan for today.";
    }

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

