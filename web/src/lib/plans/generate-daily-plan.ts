import type { SupabaseClient } from "@supabase/supabase-js";
import { getCapacityWithOverrides } from "@/lib/plan/capacity";
import {
  hasLowCompletionPattern,
  isInactive2To6Days,
  isInactive7PlusDays,
  hasHighCompletionStreak,
} from "./completion-tracking";
import { runDecisionEngine } from "@/lib/decision-engine";
import { assignActionLane } from "@/lib/decision-engine/lanes";
import { computeRelationshipStates } from "@/lib/decision-engine/state";

type CapacityLevel = "micro" | "light" | "standard" | "heavy" | "default";

interface ActionWithScore {
  action: any;
  score: number;
  isFastWinCandidate: boolean;
  lane?: string;
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

  // Boost for actions with leads (more context)
  if (action.leads) {
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

  // Light OUTREACH to recently added lead
  if (action.action_type === "OUTREACH" && action.leads) {
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
      .select("id, capacity_override, override_reason")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();

    // If plan exists and has actions (full plan), don't regenerate
    if (existingPlan) {
      const { data: planActions } = await supabase
        .from("daily_plan_actions")
        .select("id")
        .eq("daily_plan_id", existingPlan.id)
        .limit(1);
      
      // If plan has actions, it's a complete plan - don't regenerate
      if (planActions && planActions.length > 0) {
        return { success: false, error: "Plan already exists for this date" };
      }
      // If plan exists but has no actions, it might just have an override - we'll regenerate
    }

    // Get user preference for weekends and timezone
    const { data: userProfile } = await supabase
      .from("users")
      .select("exclude_weekends, timezone")
      .eq("id", userId)
      .single();

    const excludeWeekends = userProfile?.exclude_weekends ?? false;
    const userTimezone = userProfile?.timezone || "America/New_York"; // Default fallback

    // Check if date is a weekend in the user's timezone
    // Use the same utility function that's used elsewhere for consistency
    const { getDayOfWeekForDate, isDateWeekend } = await import("@/lib/utils/dateUtils");
    
    // DEBUG: Log the date calculation for troubleshooting
    console.log(`[generateDailyPlan] Date: ${date}, Timezone: ${userTimezone}`);
    
    // Check if the date is a weekend using the utility function
    // This ensures we use the same logic as getTodayInTimezone
    const isWeekend = isDateWeekend(date, userTimezone);
    const dayOfWeek = getDayOfWeekForDate(date, userTimezone);
    
    // DEBUG: Log the weekend check result
    console.log(`[generateDailyPlan] Day of week: ${dayOfWeek}, Is weekend: ${isWeekend}`);
    
    // Get day name for the error message
    const dayNames: Record<number, string> = {
      0: "Sunday",
      1: "Monday",
      2: "Tuesday",
      3: "Wednesday",
      4: "Thursday",
      5: "Friday",
      6: "Saturday",
    };
    const dayName = dayNames[dayOfWeek] || "day";

    // If weekend and user excludes weekends, skip with helpful message
    if (isWeekend && excludeWeekends) {
      return {
        success: false,
        error: `Daily plans aren't generated on ${dayName}s. You can change this preference in Settings if you'd like to receive plans on weekends.`,
      };
    }

    // Calculate capacity with overrides (checks manual override > user default > calendar)
    let capacityInfo = await getCapacityWithOverrides(supabase, userId, date);
    let capacityLevel = capacityInfo.level;
    let actionCount = capacityInfo.actionCount;

    // Declare adaptiveReason at function scope so it's accessible later
    let adaptiveReason: string | null = null;

    // Adaptive Recovery Logic: Override capacity based on user patterns
    // BUT: Only apply if there's no manual override (manual override takes precedence)
    if (capacityInfo.source !== "override") {
      const [lowCompletion, inactive2To6, inactive7Plus, highStreak] = await Promise.all([
        hasLowCompletionPattern(supabase, userId),
        isInactive2To6Days(supabase, userId),
        isInactive7PlusDays(supabase, userId),
        hasHighCompletionStreak(supabase, userId),
      ]);

      // Case 1: 7+ days inactive → Micro plan (1-2 actions)
      if (inactive7Plus) {
        capacityLevel = "micro";
        actionCount = 2;
        adaptiveReason = "comeback";
      }
      // Case 1b: 2-6 days inactive (Day 2-6 streak break) → Micro plan (2 actions)
      else if (inactive2To6) {
        capacityLevel = "micro";
        actionCount = 2;
        adaptiveReason = "streak_break";
      }
      // Case 2: Low completion pattern (3+ days < 50%) → Light plan (3-4 actions)
      else if (lowCompletion) {
        capacityLevel = "light";
        actionCount = 3;
        adaptiveReason = "low_completion";
      }
      // Case 3: High completion streak (7+ days > 80%) → Can increase capacity
      else if (highStreak) {
        // Boost to heavy if they're consistently completing (from any base capacity)
        // If already heavy, keep it; otherwise boost from standard/light to heavy
        if (capacityLevel !== "heavy") {
          capacityLevel = "heavy";
          actionCount = 8;
          adaptiveReason = "high_streak";
        }
      }
    }

    // For backward compatibility, calculate freeMinutes (approximate)
    let freeMinutes: number | null = null;
    // Approximate: capacity levels map to free minutes ranges
    if (capacityLevel === "micro") freeMinutes = 15;
    else if (capacityLevel === "light") freeMinutes = 45;
    else if (capacityLevel === "standard") freeMinutes = 90;
    else if (capacityLevel === "heavy") freeMinutes = 240;

    // Fetch candidate actions (NEW or SNOOZED due today or in past)
    // Parse date string to avoid timezone issues (same fix as client-side)
    const [year, month, day] = date.split('-').map(Number);
    const today = new Date(year, month - 1, day);
    today.setHours(0, 0, 0, 0);

    // Fetch all candidate actions
    // Note: due_date is a DATE column, so .lte("due_date", date) compares DATE to DATE string (YYYY-MM-DD)
    // This should work correctly regardless of timezone since we're comparing date-only values
    // Try with leads join first, fallback to without if it fails (RLS might block the join)
    let allCandidateActions: any[] | null = null;
    let actionsError: any = null;
    
    // First try with leads join
    const { data: actionsWithLeads, error: joinError } = await supabase
      .from("actions")
      .select(
        `
        *,
        leads (
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
    
    if (joinError) {
      console.warn("Error fetching actions with leads join, trying without join:", joinError);
      // Fallback: fetch actions without leads join
      const { data: actionsOnly, error: actionsOnlyError } = await supabase
        .from("actions")
        .select("*")
        .eq("user_id", userId)
        .in("state", ["NEW", "SNOOZED"])
        .lte("due_date", date)
        .order("due_date", { ascending: true })
        .order("created_at", { ascending: false });
      
      if (actionsOnlyError) {
        console.error("Error fetching candidate actions (both with and without join):", actionsOnlyError);
        actionsError = actionsOnlyError;
      } else {
        allCandidateActions = actionsOnly;
        // Fetch leads separately for each action if needed
        if (allCandidateActions && allCandidateActions.length > 0) {
          const leadIds = allCandidateActions
            .map(a => a.person_id)
            .filter((id): id is string => id !== null);
          
          if (leadIds.length > 0) {
            const { data: leads } = await supabase
              .from("leads")
              .select("id, name, url, notes, created_at")
              .eq("user_id", userId)
              .in("id", leadIds);
            
            // Attach leads to actions
            if (leads) {
              const leadsMap = new Map(leads.map(l => [l.id, l]));
              allCandidateActions = allCandidateActions.map(action => ({
                ...action,
                leads: action.person_id ? leadsMap.get(action.person_id) || null : null,
              }));
            }
          }
        }
      }
    } else {
      allCandidateActions = actionsWithLeads;
    }
    
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
      hadJoinError: !!joinError,
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
      
      const { data: activeLeads } = await supabase
        .from("leads")
        .select("id, name, status, created_at")
        .eq("user_id", userId)
        .eq("status", "ACTIVE");
      
      // Try to auto-create actions from active leads if no candidate actions exist
      // But first check if user is at action limit
      const { isAtActionLimit } = await import("@/lib/actions/limits");
      const atLimit = await isAtActionLimit(userId, false);

      if (activeLeads && activeLeads.length > 0 && !atLimit) {
        console.log(`No candidate actions found, attempting to create actions from ${activeLeads.length} active leads`);
        
        // Create OUTREACH actions for active leads that don't have recent actions
        // Stop if we hit the action limit
        const newActions = [];
        for (const lead of activeLeads) {
          // Check current pending count before each creation to respect limit
          const currentLimit = await isAtActionLimit(userId, false);
          if (currentLimit) {
            console.log(`Action limit reached, stopping OUTREACH creation (created ${newActions.length} so far)`);
            break;
          }

          // Check if lead already has a recent NEW action
          const { data: existingAction } = await supabase
            .from("actions")
            .select("id")
            .eq("user_id", userId)
            .eq("person_id", lead.id)
            .eq("state", "NEW")
            .eq("action_type", "OUTREACH")
            .maybeSingle();
          
          if (!existingAction) {
            // Create a new OUTREACH action for this lead, due today
            const { data: newAction, error: createError } = await supabase
              .from("actions")
              .insert({
                user_id: userId,
                person_id: lead.id,
                action_type: "OUTREACH",
                state: "NEW",
                due_date: date,
                description: `Reach out to ${lead.name}`,
                notes: `Auto-created from daily plan generation on ${new Date().toLocaleDateString()}`,
                auto_created: true,
                source: 'system',
                intent_type: 'outreach',
              })
              .select()
              .single();
            
            if (!createError && newAction) {
              // Fetch the full action with leads relation
              const { data: fullAction } = await supabase
                .from("actions")
                .select(`
                  *,
                  leads (
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
          console.log(`Created ${newActions.length} new actions from active leads`);
          candidateActions.push(...newActions);
        }
      } else if (atLimit) {
        console.log(`User ${userId} is at action limit, skipping OUTREACH creation from daily plan fallback`);
      }
      
      // If still no candidate actions after trying to create from leads
      if (!candidateActions || candidateActions.length === 0) {
        console.error("No candidate actions for plan generation:", {
          userId,
          date,
          totalActions: allActions?.length || 0,
          actionStates: allActions?.map(a => a.state) || [],
          actionDueDates: allActions?.map(a => a.due_date) || [],
          activeLeads: activeLeads?.length || 0,
        });
        
        return { 
          success: false, 
          error: "No candidate actions available for plan generation. You need actions with state NEW or SNOOZED that are due today or in the past. If you have active pins, actions should be created automatically." 
        };
      }
    }

    // Run decision engine to compute lanes and scores
    const planDate = new Date(date);
    planDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    
    console.log(`[generateDailyPlan] Running decision engine for ${candidateActions.length} actions`);
    let decisionResult;
    try {
      decisionResult = await runDecisionEngine(supabase, userId, {
        persist: true, // Persist lane and score to database
        referenceDate: planDate,
      });
      console.log(`[generateDailyPlan] Decision engine completed, scored ${decisionResult.scoredActions.length} actions`);
    } catch (error) {
      console.error("[generateDailyPlan] Error running decision engine:", error);
      return { success: false, error: `Failed to run decision engine: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }

    // Compute relationship states for lane assignment
    console.log(`[generateDailyPlan] Computing relationship states`);
    let relationshipStates;
    try {
      relationshipStates = await computeRelationshipStates(
        supabase,
        userId,
        planDate
      );
      console.log(`[generateDailyPlan] Relationship states computed for ${relationshipStates.size} relationships`);
    } catch (error) {
      console.error("[generateDailyPlan] Error computing relationship states:", error);
      return { success: false, error: `Failed to compute relationship states: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }

    // Score and sort actions using decision engine
    const { assignRelationshipLane } = await import("@/lib/decision-engine/lanes");
    
    const actionsWithScores: ActionWithScore[] = [];
    for (const action of candidateActions) {
      // Get relationship state if action is tied to a relationship
      const relationshipState = action.person_id
        ? relationshipStates.get(action.person_id) || null
        : null;
      
      // Get relationship lane
      const relationshipLane = relationshipState
        ? assignRelationshipLane(relationshipState).lane
        : "on_deck";
      
      // Get action lane
      const actionLane = assignActionLane(action, relationshipLane, planDate).lane;
      
      // Get score from decision engine result
      const scoredAction = decisionResult.scoredActions.find(
        (s) => s.actionId === action.id
      );
      
      const score = scoredAction?.score || 0;
      
      // Fast Win criteria: Priority lane, high score, estimated ≤ 30 minutes
      const isFastWinCandidate = 
        actionLane === "priority" &&
        score >= 50 &&
        (action.estimated_minutes === null || action.estimated_minutes <= 30);
      
      actionsWithScores.push({
        action,
        score,
        isFastWinCandidate,
        lane: actionLane,
      });
    }

    // Sort by lane (priority first), then by score (descending)
    actionsWithScores.sort((a, b) => {
      const laneOrder = { priority: 0, in_motion: 1, on_deck: 2 };
      const aLaneOrder = laneOrder[a.lane as keyof typeof laneOrder] ?? 3;
      const bLaneOrder = laneOrder[b.lane as keyof typeof laneOrder] ?? 3;
      
      if (aLaneOrder !== bLaneOrder) {
        return aLaneOrder - bLaneOrder;
      }
      
      return b.score - a.score;
    });

    // Select Fast Win (first fast win candidate in Priority lane)
    let fastWin: ActionWithScore | null = null;
    const fastWinIndex = actionsWithScores.findIndex(
      (a) => a.isFastWinCandidate
    );
    if (fastWinIndex >= 0) {
      fastWin = actionsWithScores[fastWinIndex];
      actionsWithScores.splice(fastWinIndex, 1);
    }

    // Select remaining actions up to capacity (prioritize Priority and In Motion lanes)
    const selectedActions = actionsWithScores.slice(0, actionCount - 1); // -1 because fast win counts

    // Get weekly focus statement (if available)
    // TODO: Fetch from weekly_summaries table
    let focusStatement: string | null = null;

    // Add adaptive messaging based on recovery reason
    if (adaptiveReason === "comeback") {
      focusStatement = "Welcome back. One small win to restart your momentum.";
    } else if (adaptiveReason === "streak_break") {
      focusStatement = "Let's ease back in — here are your highest-impact moves for today.";
    } else if (adaptiveReason === "low_completion") {
      focusStatement = "Let's ease back in — here are your highest-impact moves for today.";
    } else if (adaptiveReason === "high_streak") {
      focusStatement = "You're on a roll! Here's your plan for today.";
    }

    // Create or update daily_plan record
    // If plan exists (with just override), update it; otherwise create new
    console.log(`[generateDailyPlan] Creating/updating daily plan:`, {
      existingPlan: existingPlan?.id || null,
      date,
      capacityLevel,
      actionCount,
      selectedActionsCount: selectedActions.length,
      fastWin: fastWin ? fastWin.action.id : null,
    });
    
    let dailyPlan;
    if (existingPlan) {
      // Update existing plan (preserve override if it exists)
      const { data: updatedPlan, error: updateError } = await supabase
        .from("daily_plans")
        .update({
          focus_statement: focusStatement,
          capacity: capacityLevel,
          free_minutes: freeMinutes,
          // Preserve existing override if it exists
          capacity_override: existingPlan.capacity_override || null,
          override_reason: existingPlan.override_reason || null,
        })
        .eq("id", existingPlan.id)
        .select()
        .single();
      
      if (updateError) {
        console.error("Error updating daily plan:", updateError);
        return { success: false, error: "Failed to update daily plan" };
      }
      dailyPlan = updatedPlan;
      console.log(`[generateDailyPlan] Updated existing plan:`, dailyPlan.id);
    } else {
      // Create new plan
      const { data: newPlan, error: planError } = await supabase
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
      dailyPlan = newPlan;
      console.log(`[generateDailyPlan] Created new plan:`, dailyPlan.id);
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
      console.log(`[generateDailyPlan] Creating ${planActions.length} plan actions`);
      const { error: planActionsError } = await supabase
        .from("daily_plan_actions")
        .insert(planActions);

      if (planActionsError) {
        console.error("Error creating plan actions:", planActionsError);
        // Rollback: delete the daily_plan
        await supabase.from("daily_plans").delete().eq("id", dailyPlan.id);
        return { success: false, error: "Failed to create plan actions" };
      }
      console.log(`[generateDailyPlan] Successfully created ${planActions.length} plan actions`);
    } else {
      console.warn(`[generateDailyPlan] No plan actions to create (planActions.length = 0)`);
    }

    console.log(`[generateDailyPlan] Plan generation completed successfully:`, {
      planId: dailyPlan.id,
      actionCount: planActions.length,
    });

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

