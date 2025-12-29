/**
 * Decision Engine - Main Orchestrator
 * 
 * Coordinates state precomputation, lane assignment, and scoring to:
 * - Assign lanes to relationships and actions
 * - Compute NextMoveScore for actions
 * - Select the single "Best Action" per user
 * - Persist lane and score data
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { computeRelationshipStates } from "./state";
import { assignRelationshipLane, assignActionLane, type Lane } from "./lanes";
import {
  calculateNextMoveScore,
  selectBestAction,
  type ScoredAction,
} from "./scoring";
import {
  getEmailSignalsForRelationship,
  type EmailSignalsForDecision,
} from "@/lib/email/decision-engine";

export interface DecisionEngineResult {
  bestAction: {
    actionId: string;
    relationshipId: string | null;
    score: number;
    lane: Lane;
    reason: string;
  } | null;
  relationshipStates: Map<string, any>;
  scoredActions: ScoredAction[];
}

/**
 * Run the decision engine for a user.
 * 
 * This function:
 * 1. Computes relationship states
 * 2. Assigns lanes to relationships
 * 3. Fetches candidate actions
 * 4. Assigns lanes to actions
 * 5. Scores all candidate actions
 * 6. Selects the best action
 * 7. Optionally persists results to database
 */
export async function runDecisionEngine(
  supabase: SupabaseClient,
  userId: string,
  options: {
    persist?: boolean; // Whether to persist lane/score to database
    referenceDate?: Date; // Date to use for calculations (default: today)
    maxDurationMinutes?: number | null; // Optional maximum duration in minutes to filter actions
  } = {}
): Promise<DecisionEngineResult> {
  const { persist = false, referenceDate = new Date(), maxDurationMinutes } = options;
  
  // Step 1: Compute relationship states
  const relationshipStates = await computeRelationshipStates(
    supabase,
    userId,
    referenceDate
  );
  
  // Step 2: Fetch candidate actions (NEW, SENT, SNOOZED)
  const { data: candidateActions, error: actionsError } = await supabase
    .from("actions")
    .select("*")
    .eq("user_id", userId)
    .in("state", ["NEW", "SENT", "SNOOZED"])
    .lte("due_date", referenceDate.toISOString().split("T")[0]);
  
  if (actionsError) {
    console.error("Error fetching candidate actions:", actionsError);
    return {
      bestAction: null,
      relationshipStates,
      scoredActions: [],
    };
  }
  
  if (!candidateActions || candidateActions.length === 0) {
    return {
      bestAction: null,
      relationshipStates,
      scoredActions: [],
    };
  }

  // Step 2.5: Fetch email signals for relationships that have email addresses
  // Cache email signals to avoid repeated API calls
  const emailSignalsCache = new Map<string, EmailSignalsForDecision>();
  const relationshipsNeedingEmailSignals = new Set<string>();
  
  // Get unique person_ids from actions
  const personIds = [
    ...new Set(
      candidateActions
        .map((a) => a.person_id)
        .filter((id): id is string => id !== null)
    ),
  ];

  // Fetch leads for these person_ids to check for email addresses
  const leadsMap = new Map<string, { id: string; url: string | null }>();
  if (personIds.length > 0) {
    const { data: leads } = await supabase
      .from("leads")
      .select("id, url")
      .eq("user_id", userId)
      .in("id", personIds);

    if (leads) {
      // Build map and find relationships with email addresses
      for (const lead of leads) {
        leadsMap.set(lead.id, lead);
        if (lead.url?.startsWith("mailto:")) {
          relationshipsNeedingEmailSignals.add(lead.id);
        }
      }
    }
  }

  // Fetch email signals for all relationships that need them
  // Note: This is done in parallel but with error handling for graceful degradation
  const emailSignalsPromises = Array.from(relationshipsNeedingEmailSignals).map(
    async (leadId) => {
      try {
        const lead = leadsMap.get(leadId);
        if (!lead) return null;
        
        const signals = await getEmailSignalsForRelationship(
          supabase,
          userId,
          leadId,
          lead.url || null
        );
        return { leadId, signals };
      } catch (error) {
        console.error(`Error fetching email signals for relationship ${leadId}:`, error);
        // Graceful degradation: return null if email signals can't be fetched
        return null;
      }
    }
  );

  const emailSignalsResults = await Promise.all(emailSignalsPromises);
  for (const result of emailSignalsResults) {
    if (result) {
      emailSignalsCache.set(result.leadId, result.signals);
    }
  }
  
  // Step 3.5: Filter actions by estimated_minutes if maxDurationMinutes is provided
  let actionsToProcess = candidateActions;
  if (maxDurationMinutes !== null && maxDurationMinutes !== undefined) {
    actionsToProcess = candidateActions.filter((action) => {
      const estimatedMinutes = (action as any).estimated_minutes;
      // Include actions with no estimate (null/undefined) OR actions with estimate <= maxDurationMinutes
      return estimatedMinutes === null || estimatedMinutes === undefined || estimatedMinutes <= maxDurationMinutes;
    });
    
    if (actionsToProcess.length === 0) {
      // No actions match the duration filter - return null
      return {
        bestAction: null,
        relationshipStates,
        scoredActions: [],
      };
    }
  }
  
  // Step 3: Assign lanes and score actions
  const scoredActions: ScoredAction[] = [];
  const actionUpdates: Array<{
    id: string;
    lane: Lane;
    next_move_score: number;
  }> = [];
  
  for (const action of actionsToProcess) {
    // Get relationship state if action is tied to a relationship
    const relationshipState = action.person_id
      ? relationshipStates.get(action.person_id) || null
      : null;
    
    // Get email signals if available
    const emailSignals = action.person_id
      ? emailSignalsCache.get(action.person_id) || null
      : null;
    
    // Assign relationship lane (if relationship exists)
    const relationshipLane = relationshipState
      ? assignRelationshipLane(relationshipState).lane
      : "on_deck";
    
    // Assign action lane
    const actionLaneAssignment = assignActionLane(
      action,
      relationshipLane,
      referenceDate
    );
    
    // Score the action (with email signals if available)
    const scored = calculateNextMoveScore(
      action,
      relationshipState,
      referenceDate,
      emailSignals
    );
    
    scoredActions.push(scored);
    
    // Prepare update for persistence
    if (persist) {
      actionUpdates.push({
        id: action.id,
        lane: actionLaneAssignment.lane,
        next_move_score: scored.score,
      });
    }
  }
  
  // Step 4: Select best action (from Priority and In Motion lanes only)
  const priorityAndInMotionActions = scoredActions.filter((scored) => {
    const action = actionsToProcess.find((a) => a.id === scored.actionId);
    if (!action) return false;
    
    const relationshipState = action.person_id
      ? relationshipStates.get(action.person_id) || null
      : null;
    const relationshipLane = relationshipState
      ? assignRelationshipLane(relationshipState).lane
      : "on_deck";
    const actionLane = assignActionLane(action, relationshipLane, referenceDate)
      .lane;
    
    return actionLane === "priority" || actionLane === "in_motion";
  });
  
  const bestScoredAction = selectBestAction(priorityAndInMotionActions);
  
  let bestAction: DecisionEngineResult["bestAction"] = null;
  
  if (bestScoredAction) {
    const bestActionData = actionsToProcess.find(
      (a) => a.id === bestScoredAction.actionId
    );
    
    if (bestActionData) {
      const relationshipState = bestActionData.person_id
        ? relationshipStates.get(bestActionData.person_id) || null
        : null;
      const relationshipLane = relationshipState
        ? assignRelationshipLane(relationshipState).lane
        : "on_deck";
      const actionLane = assignActionLane(
        bestActionData,
        relationshipLane,
        referenceDate
      ).lane;
      
      // Build reason including duration filter info if applicable
      let reason = bestScoredAction.reason;
      if (maxDurationMinutes !== null && maxDurationMinutes !== undefined) {
        reason = `${reason} (fits ${maxDurationMinutes}-minute window)`;
      }
      
      bestAction = {
        actionId: bestScoredAction.actionId,
        relationshipId: bestActionData.person_id || null,
        score: bestScoredAction.score,
        lane: actionLane,
        reason,
      };
    }
  }
  
  // Step 6: Log score breakdowns for debugging
  if (bestAction) {
    const bestScored = scoredActions.find((s) => s.actionId === bestAction!.actionId);
    if (bestScored) {
      console.log(`[Decision Engine] Best Action Selected:`, {
        actionId: bestAction.actionId,
        relationshipId: bestAction.relationshipId,
        lane: bestAction.lane,
        score: bestAction.score,
        breakdown: bestScored.breakdown,
        reason: bestAction.reason,
      });
    }
  }
  
  // Log top 5 scored actions for debugging
  const topActions = [...scoredActions]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  console.log(`[Decision Engine] Top 5 Actions:`, topActions.map((s) => ({
    actionId: s.actionId,
    score: s.score,
    breakdown: s.breakdown,
    reason: s.reason,
  })));
  
  // Step 7: Persist results if requested
  if (persist && actionUpdates.length > 0) {
    // Update actions with lane and score
    for (const update of actionUpdates) {
      await supabase
        .from("actions")
        .update({
          lane: update.lane,
          next_move_score: update.next_move_score,
        })
        .eq("id", update.id);
    }
    
    // Update relationships with next_move_action_id
    if (bestAction) {
      // Clear existing next_move_action_id for all relationships
      const relationshipIds = Array.from(relationshipStates.keys());
      if (relationshipIds.length > 0) {
        await supabase
          .from("leads")
          .update({ next_move_action_id: null })
          .in("id", relationshipIds);
      }
      
      // Set next_move_action_id for the relationship with the best action
      if (bestAction.relationshipId) {
        await supabase
          .from("leads")
          .update({ next_move_action_id: bestAction.actionId })
          .eq("id", bestAction.relationshipId);
      }
    }
  }
  
  return {
    bestAction,
    relationshipStates,
    scoredActions,
  };
}

/**
 * Get the best action for a user (quick helper).
 * 
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param maxDurationMinutes - Optional maximum duration in minutes to filter actions
 */
export async function getBestAction(
  supabase: SupabaseClient,
  userId: string,
  maxDurationMinutes?: number | null
): Promise<DecisionEngineResult["bestAction"]> {
  const result = await runDecisionEngine(supabase, userId, { 
    persist: false,
    maxDurationMinutes,
  });
  return result.bestAction;
}

