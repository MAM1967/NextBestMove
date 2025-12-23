/**
 * Decision Engine Lane Assignment
 * 
 * Assigns relationships and actions to lanes: Priority / In Motion / On Deck
 * Based on rules from docs/Architecture/Decision_Engine_Implementation_Spec.md
 */

import type { RelationshipState } from "./state";

export type Lane = "priority" | "in_motion" | "on_deck";

export interface LaneAssignment {
  lane: Lane;
  reason: string;
}

/**
 * Calculate business days between two dates (excluding weekends).
 */
function businessDaysBetween(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * Assign a lane to a relationship based on its state.
 */
export function assignRelationshipLane(
  state: RelationshipState
): LaneAssignment {
  // Priority lane: requires attention now
  if (state.overdueActionsCount > 0) {
    return {
      lane: "priority",
      reason: `Has ${state.overdueActionsCount} overdue action(s)`,
    };
  }
  
  // Check if earliest relevant insight date is within 5 business days
  if (state.earliestRelevantInsightDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const businessDays = businessDaysBetween(
      today,
      state.earliestRelevantInsightDate
    );
    
    if (businessDays <= 5) {
      return {
        lane: "priority",
        reason: `Relevant insight due within ${businessDays} business days`,
      };
    }
  }
  
  // Check if momentum is declining and past cadence
  if (
    state.momentumTrend === "declining" &&
    state.daysSinceLastInteraction !== null &&
    state.cadenceDays !== null &&
    state.daysSinceLastInteraction > state.cadenceDays
  ) {
    return {
      lane: "priority",
      reason: `Momentum declining and ${state.daysSinceLastInteraction} days since last interaction (cadence: ${state.cadenceDays} days)`,
    };
  }
  
  // Check if awaiting response and overdue
  if (state.awaitingResponse) {
    // Consider response overdue if > 7 days since last interaction
    if (
      state.daysSinceLastInteraction !== null &&
      state.daysSinceLastInteraction > 7
    ) {
      return {
        lane: "priority",
        reason: `Awaiting response and ${state.daysSinceLastInteraction} days since last interaction`,
      };
    }
  }
  
  // In Motion lane: active, within cadence
  if (state.pendingActionsCount > 0) {
    return {
      lane: "in_motion",
      reason: `Has ${state.pendingActionsCount} pending action(s)`,
    };
  }
  
  // Check if next touch is due within cadence window
  if (state.nextTouchDueAt) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const touchDue = new Date(state.nextTouchDueAt);
    touchDue.setHours(0, 0, 0, 0);
    
    if (touchDue <= today || touchDue <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
      return {
        lane: "in_motion",
        reason: `Next touch due ${state.nextTouchDueAt ? "soon" : "now"}`,
      };
    }
  }
  
  // On Deck lane: no pending work, low-touch
  return {
    lane: "on_deck",
    reason: "No pending actions, low-touch relationship",
  };
}

/**
 * Assign a lane to an action based on its properties and relationship lane.
 */
export function assignActionLane(
  action: {
    due_date: string | Date;
    state: string;
    person_id?: string | null;
  },
  relationshipLane: Lane,
  today: Date = new Date()
): LaneAssignment {
  const dueDate = new Date(action.due_date);
  dueDate.setHours(0, 0, 0, 0);
  const todayDate = new Date(today);
  todayDate.setHours(0, 0, 0, 0);
  
  const daysUntilDue = Math.floor(
    (dueDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Priority lane for actions
  if (daysUntilDue <= 2) {
    return {
      lane: "priority",
      reason: `Due within 2 days (${daysUntilDue <= 0 ? "overdue" : `${daysUntilDue} day(s) away`})`,
    };
  }
  
  // Check if action is high priority and in NEW or SENT state
  // (This would need a priority field on actions - for now, we'll use action type)
  const highPriorityTypes = ["FOLLOW_UP", "CALL_PREP", "POST_CALL"];
  const actionType = (action as any).action_type;
  if (
    actionType &&
    highPriorityTypes.includes(actionType) &&
    (action.state === "NEW" || action.state === "SENT")
  ) {
    return {
      lane: "priority",
      reason: `High priority action type (${actionType}) in ${action.state} state`,
    };
  }
  
  // In Motion lane
  if (daysUntilDue <= 14 && (relationshipLane === "priority" || relationshipLane === "in_motion")) {
    return {
      lane: "in_motion",
      reason: `Due within 14 days and relationship is ${relationshipLane}`,
    };
  }
  
  // On Deck lane: everything else
  return {
    lane: "on_deck",
    reason: "Long-range or low-priority action",
  };
}

