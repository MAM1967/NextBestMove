/**
 * Decision Engine State Precomputation
 * 
 * Computes per-relationship state from existing entities (Relationships, Actions, Interactions, Insights).
 * This module provides the inputs needed for lane assignment and scoring.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface RelationshipState {
  relationshipId: string;
  userId: string;
  
  // Precomputed metrics
  daysSinceLastInteraction: number | null;
  pendingActionsCount: number;
  overdueActionsCount: number;
  awaitingResponse: boolean;
  earliestRelevantInsightDate: Date | null;
  
  // Relationship metadata
  cadence: "frequent" | "moderate" | "infrequent" | "ad_hoc" | null;
  cadenceDays: number | null;
  tier: "inner" | "active" | "warm" | "background" | null;
  lastInteractionAt: Date | null;
  nextTouchDueAt: Date | null;
  momentumScore: number | null;
  momentumTrend: "increasing" | "stable" | "declining" | "unknown";
  
  // Next move
  nextMoveActionId: string | null;
}

/**
 * Compute relationship state for all active relationships for a user.
 * Returns a map of relationship_id -> RelationshipState.
 */
export async function computeRelationshipStates(
  supabase: SupabaseClient,
  userId: string,
  referenceDate: Date = new Date()
): Promise<Map<string, RelationshipState>> {
  const states = new Map<string, RelationshipState>();
  
  // Fetch all active relationships (leads)
  const { data: relationships, error: relError } = await supabase
    .from("leads")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "ACTIVE");
  
  if (relError) {
    console.error("Error fetching relationships:", relError);
    return states;
  }
  
  if (!relationships || relationships.length === 0) {
    return states;
  }
  
  // Fetch all pending actions for these relationships
  const relationshipIds = relationships.map((r) => r.id);
  const { data: actions, error: actionsError } = await supabase
    .from("actions")
    .select("*")
    .eq("user_id", userId)
    .in("person_id", relationshipIds)
    .in("state", ["NEW", "SENT", "SNOOZED"]);
  
  if (actionsError) {
    console.error("Error fetching actions:", actionsError);
  }
  
  // Group actions by relationship
  const actionsByRelationship = new Map<string, any[]>();
  (actions || []).forEach((action) => {
    if (action.person_id) {
      const existing = actionsByRelationship.get(action.person_id) || [];
      existing.push(action);
      actionsByRelationship.set(action.person_id, existing);
    }
  });
  
  // Compute state for each relationship
  for (const relationship of relationships) {
    const relationshipActions = actionsByRelationship.get(relationship.id) || [];
    
    // Calculate days since last interaction
    let daysSinceLastInteraction: number | null = null;
    let lastInteractionAt: Date | null = null;
    
    if (relationship.last_interaction_at) {
      lastInteractionAt = new Date(relationship.last_interaction_at);
      const diffMs = referenceDate.getTime() - lastInteractionAt.getTime();
      daysSinceLastInteraction = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    } else {
      // Fallback: use most recent completed action
      const { data: lastCompletedAction } = await supabase
        .from("actions")
        .select("completed_at")
        .eq("user_id", userId)
        .eq("person_id", relationship.id)
        .in("state", ["DONE", "REPLIED"])
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (lastCompletedAction?.completed_at) {
        lastInteractionAt = new Date(lastCompletedAction.completed_at);
        const diffMs = referenceDate.getTime() - lastInteractionAt.getTime();
        daysSinceLastInteraction = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }
    }
    
    // Count pending and overdue actions
    const today = new Date(referenceDate);
    today.setHours(0, 0, 0, 0);
    
    let pendingActionsCount = 0;
    let overdueActionsCount = 0;
    
    for (const action of relationshipActions) {
      if (action.state === "NEW" || action.state === "SENT" || action.state === "SNOOZED") {
        pendingActionsCount++;
        
        const dueDate = new Date(action.due_date);
        dueDate.setHours(0, 0, 0, 0);
        
        if (dueDate < today) {
          overdueActionsCount++;
        }
      }
    }
    
    // Check for awaiting response (actions in SENT state)
    const awaitingResponse = relationshipActions.some(
      (a) => a.state === "SENT"
    );
    
    // Calculate cadence_days from cadence enum if not set
    let cadenceDays = relationship.cadence_days;
    if (!cadenceDays && relationship.cadence) {
      switch (relationship.cadence) {
        case "frequent":
          cadenceDays = 7; // Weekly
          break;
        case "moderate":
          cadenceDays = 14; // Bi-weekly
          break;
        case "infrequent":
          cadenceDays = 30; // Monthly
          break;
        case "ad_hoc":
          cadenceDays = 90; // Quarterly
          break;
        default:
          cadenceDays = 30; // Default to monthly
      }
    }
    
    // TODO: Fetch earliest relevant insight date from insights table
    // For now, this is null until insights are implemented
    const earliestRelevantInsightDate: Date | null = null;
    
    // Parse momentum trend
    const momentumTrend = (relationship.momentum_trend as RelationshipState["momentumTrend"]) || "unknown";
    
    const state: RelationshipState = {
      relationshipId: relationship.id,
      userId: relationship.user_id,
      daysSinceLastInteraction,
      pendingActionsCount,
      overdueActionsCount,
      awaitingResponse,
      earliestRelevantInsightDate,
      cadence: relationship.cadence as RelationshipState["cadence"],
      cadenceDays,
      tier: relationship.tier as RelationshipState["tier"],
      lastInteractionAt,
      nextTouchDueAt: relationship.next_touch_due_at
        ? new Date(relationship.next_touch_due_at)
        : null,
      momentumScore: relationship.momentum_score
        ? parseFloat(relationship.momentum_score.toString())
        : null,
      momentumTrend,
      nextMoveActionId: relationship.next_move_action_id || null,
    };
    
    states.set(relationship.id, state);
  }
  
  return states;
}

/**
 * Compute state for a single relationship.
 */
export async function computeRelationshipState(
  supabase: SupabaseClient,
  userId: string,
  relationshipId: string,
  referenceDate: Date = new Date()
): Promise<RelationshipState | null> {
  const states = await computeRelationshipStates(supabase, userId, referenceDate);
  return states.get(relationshipId) || null;
}




