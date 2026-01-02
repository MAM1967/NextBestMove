/**
 * Relationship State Machine
 * 
 * Implements the relationship state machine based on Decision Engine refinement.
 * States: UNENGAGED, ACTIVE_CONVERSATION, OPPORTUNITY, WARM_BUT_PASSIVE, DORMANT
 * 
 * NEX-46: Relationship State Machine Implementation
 */

export type RelationshipState =
  | "UNENGAGED"
  | "ACTIVE_CONVERSATION"
  | "OPPORTUNITY"
  | "WARM_BUT_PASSIVE"
  | "DORMANT";

export type ActionType =
  | "OUTREACH"
  | "FOLLOW_UP"
  | "NURTURE"
  | "CALL_PREP"
  | "POST_CALL"
  | "CONTENT"
  | "FAST_WIN";

export interface RelationshipStateInput {
  lastInteractionAt: Date | null;
  daysSinceLastInteraction: number;
  hasRecentEmail: boolean;
  hasRecentResponse: boolean;
  hasScheduledMeeting: boolean;
  hasOpenOpportunity: boolean;
  hasExplicitNo: boolean;
  silenceDays: number;
  tier: "inner" | "active" | "warm" | "background" | null;
}

/**
 * Valid action types per relationship state
 */
export const VALID_ACTIONS_BY_STATE: Record<RelationshipState, ActionType[]> = {
  UNENGAGED: ["OUTREACH", "NURTURE"],
  ACTIVE_CONVERSATION: ["POST_CALL", "FOLLOW_UP"],
  OPPORTUNITY: ["FOLLOW_UP", "POST_CALL"],
  WARM_BUT_PASSIVE: ["NURTURE"],
  DORMANT: ["NURTURE"], // Occasional only
};

/**
 * Detect relationship state based on actions, emails, and signals
 */
export function detectRelationshipState(
  input: RelationshipStateInput
): RelationshipState {
  const {
    daysSinceLastInteraction,
    hasRecentEmail,
    hasRecentResponse,
    hasScheduledMeeting,
    hasOpenOpportunity,
    hasExplicitNo,
    silenceDays,
  } = input;

  // DORMANT: Explicit no or very long silence (90+ days)
  if (hasExplicitNo || silenceDays >= 90) {
    return "DORMANT";
  }

  // OPPORTUNITY: Has open opportunity/deal
  if (hasOpenOpportunity) {
    return "OPPORTUNITY";
  }

  // ACTIVE_CONVERSATION: Recent back-and-forth (within 7 days) or scheduled meeting
  if (
    (hasRecentEmail && hasRecentResponse && daysSinceLastInteraction <= 7) ||
    hasScheduledMeeting
  ) {
    return "ACTIVE_CONVERSATION";
  }

  // WARM_BUT_PASSIVE: Mutual awareness but no urgency (7-30 days since interaction)
  if (daysSinceLastInteraction > 7 && daysSinceLastInteraction <= 30) {
    return "WARM_BUT_PASSIVE";
  }

  // UNENGAGED: No recent signals (30+ days or never interacted)
  return "UNENGAGED";
}

/**
 * Get valid action types for a given state
 */
export function getValidActionsForState(
  state: RelationshipState
): ActionType[] {
  return VALID_ACTIONS_BY_STATE[state] || [];
}

/**
 * Check if an action type is valid for a given state
 */
export function isValidActionForState(
  state: RelationshipState,
  actionType: ActionType
): boolean {
  return getValidActionsForState(state).includes(actionType);
}

/**
 * Check if a state transition is allowed
 */
export function canTransitionToState(
  currentState: RelationshipState | null,
  newState: RelationshipState
): boolean {
  // Always allow transitions (state machine will auto-detect correct state)
  // But we can add business rules here if needed
  return true;
}

/**
 * Get state transition triggers
 */
export function getStateTransitionTriggers(): Record<
  RelationshipState,
  string[]
> {
  return {
    UNENGAGED: [
      "They respond",
      "A meeting is scheduled",
      "They engage with content meaningfully",
    ],
    ACTIVE_CONVERSATION: [
      "Opportunity confirmed → OPPORTUNITY",
      "Explicit 'no' → DORMANT",
      "Silence beyond threshold → WARM_BUT_PASSIVE",
    ],
    OPPORTUNITY: [
      "Deal won → Active Client / Partner",
      "Deal lost → DORMANT",
      "Decision deferred → WARM_BUT_PASSIVE",
    ],
    WARM_BUT_PASSIVE: [
      "Inbound signal (job change, funding, post, email)",
      "Periodic re-engagement window opens",
    ],
    DORMANT: ["Clear external signal", "Time-based reactivation rule"],
  };
}

/**
 * Determine next state based on current state, context, and action taken
 * Used when closing an action to transition relationship state
 */
export function determineNextState(
  currentState: RelationshipState,
  context: {
    lastInteractionAt: Date | null;
    overdueActionsCount?: number;
    emailSignals?: any[];
    calendarEvents?: any[];
    actionType?: string;
    completionEvents?: {
      next_call_calendared_at?: string | null;
      replied_to_email_at?: string | null;
      got_response_at?: string | null;
    };
  },
  actionType?: ActionType
): RelationshipState {
  const now = new Date();
  const daysSinceLastInteraction = context.lastInteractionAt
    ? Math.floor((now.getTime() - context.lastInteractionAt.getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  // If got response or next call calendared, move to ACTIVE_CONVERSATION
  if (context.completionEvents?.got_response_at || context.completionEvents?.next_call_calendared_at) {
    if (currentState === "UNENGAGED") {
      return "ACTIVE_CONVERSATION";
    }
    // If already in ACTIVE_CONVERSATION, stay there
    if (currentState === "ACTIVE_CONVERSATION") {
      return "ACTIVE_CONVERSATION";
    }
  }

  // If replied to email, might be moving to ACTIVE_CONVERSATION
  if (context.completionEvents?.replied_to_email_at) {
    if (currentState === "UNENGAGED") {
      return "ACTIVE_CONVERSATION";
    }
  }

  // If OUTREACH action completed, transition from UNENGAGED to ACTIVE_CONVERSATION
  if (actionType === "OUTREACH" && currentState === "UNENGAGED") {
    return "ACTIVE_CONVERSATION";
  }

  // If POST_CALL action completed, might transition to OPPORTUNITY or stay in ACTIVE_CONVERSATION
  if (actionType === "POST_CALL" && currentState === "ACTIVE_CONVERSATION") {
    // For now, stay in ACTIVE_CONVERSATION (user can manually mark as OPPORTUNITY)
    return "ACTIVE_CONVERSATION";
  }

  // Default: stay in current state
  return currentState;
}

