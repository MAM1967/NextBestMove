/**
 * Decision Engine Scoring
 * 
 * Computes NextMoveScore for candidate actions.
 * Score components: Urgency, Stall Risk, Value, Effort Bias
 * Based on docs/Architecture/Decision_Engine_Implementation_Spec.md
 */

import type { RelationshipState } from "./state";
import type { EmailSignalsForDecision } from "@/lib/email/decision-engine";

export interface ScoreBreakdown {
  urgency: number; // 0-40
  stallRisk: number; // 0-25
  value: number; // 0-20
  effortBias: number; // 0-15
  total: number; // 0-100
}

export interface ScoredAction {
  actionId: string;
  score: number;
  breakdown: ScoreBreakdown;
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
 * Calculate urgency score (0-40).
 * Boosted for overdue promises.
 */
function calculateUrgency(
  dueDate: Date,
  today: Date = new Date(),
  promisedDueAt?: Date | null
): number {
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const todayDate = new Date(today);
  todayDate.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor(
    (due.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  let urgency = 0;
  
  // Overdue → 40
  if (daysDiff < 0) {
    urgency = 40;
  }
  // Due ≤ 2 days → 30
  else if (daysDiff <= 2) {
    urgency = 30;
  }
  // Due ≤ 7 days → 20
  else if (daysDiff <= 7) {
    urgency = 20;
  }
  // No due date or far out → 5
  else {
    urgency = 5;
  }
  
  // Boost for overdue promises (extra urgency)
  if (promisedDueAt) {
    const promisedDue = new Date(promisedDueAt);
    promisedDue.setHours(0, 0, 0, 0);
    const promisedDaysDiff = Math.floor(
      (promisedDue.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (promisedDaysDiff < 0) {
      // Overdue promise → max urgency (40) + extra boost
      urgency = 40;
    } else if (promisedDaysDiff <= 2) {
      // Promise due soon → boost urgency
      urgency = Math.max(urgency, 35);
    } else if (promisedDaysDiff <= 7) {
      // Promise this week → moderate boost
      urgency = Math.max(urgency, urgency + 5);
    }
  }
  
  return Math.min(urgency, 40); // Cap at 40
}

/**
 * Calculate stall risk score (0-25).
 * Now includes email signals (open loops, unanswered asks).
 */
function calculateStallRisk(
  relationshipState: RelationshipState | null,
  emailSignals?: EmailSignalsForDecision | null
): number {
  if (!relationshipState) {
    return 0;
  }
  
  let score = 0;
  
  // Momentum declining → +15
  if (relationshipState.momentumTrend === "declining") {
    score += 15;
  }
  
  // Days since last interaction > cadence → +10
  if (
    relationshipState.daysSinceLastInteraction !== null &&
    relationshipState.cadenceDays !== null &&
    relationshipState.daysSinceLastInteraction > relationshipState.cadenceDays
  ) {
    score += 10;
  }

  // Email signals: open loops → +8 (unresolved items need attention)
  if (emailSignals?.hasOpenLoops) {
    score += 8;
  }

  // Email signals: unanswered asks → +7 (pending requests need response)
  if (emailSignals?.hasUnansweredAsks) {
    score += 7;
  }

  // Email signals: no recent email activity (last email > 14 days ago) → +5
  if (
    emailSignals?.daysSinceLastEmail !== null &&
    emailSignals?.daysSinceLastEmail !== undefined &&
    emailSignals.daysSinceLastEmail > 14
  ) {
    score += 5;
  }
  
  return Math.min(score, 25); // Cap at 25
}

/**
 * Calculate value score (0-20) based on relationship tier/importance.
 */
function calculateValue(
  relationshipState: RelationshipState | null
): number {
  if (!relationshipState) {
    return 5; // Default low value
  }
  
  const tier = relationshipState.tier;
  
  // Inner tier → +20
  if (tier === "inner") {
    return 20;
  }
  
  // Active tier → +10
  if (tier === "active") {
    return 10;
  }
  
  // Warm/Background → +5
  if (tier === "warm" || tier === "background") {
    return 5;
  }
  
  // No tier set → default to 5
  return 5;
}

/**
 * Calculate effort bias score (0-15) based on estimated duration.
 */
function calculateEffortBias(
  estimatedMinutes: number | null
): number {
  if (!estimatedMinutes) {
    return 5; // Default if not set
  }
  
  // ≤ 30 minutes → +15
  if (estimatedMinutes <= 30) {
    return 15;
  }
  
  // ≤ 120 minutes → +10
  if (estimatedMinutes <= 120) {
    return 10;
  }
  
  // Longer → +5
  return 5;
}

/**
 * Calculate NextMoveScore for an action.
 */
export function calculateNextMoveScore(
  action: {
    id: string;
    due_date: string | Date;
    estimated_minutes?: number | null;
    person_id?: string | null;
    promised_due_at?: string | Date | null;
  },
  relationshipState: RelationshipState | null,
  today: Date = new Date(),
  emailSignals?: EmailSignalsForDecision | null
): ScoredAction {
  const promisedDueAt = action.promised_due_at 
    ? new Date(action.promised_due_at) 
    : null;
  
  const urgency = calculateUrgency(
    new Date(action.due_date), 
    today,
    promisedDueAt
  );
  const stallRisk = calculateStallRisk(relationshipState, emailSignals);
  const value = calculateValue(relationshipState);
  const effortBias = calculateEffortBias(action.estimated_minutes || null);
  
  const total = urgency + stallRisk + value + effortBias;
  
  // Build reason string
  const reasons: string[] = [];
  if (urgency >= 30) {
    reasons.push("high urgency");
  }
  if (promisedDueAt) {
    const promisedDaysDiff = Math.floor(
      (promisedDueAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (promisedDaysDiff < 0) {
      reasons.push("overdue promise");
    } else if (promisedDaysDiff <= 2) {
      reasons.push("promised soon");
    }
  }
  if (stallRisk > 0) {
    const stallReasons: string[] = [];
    if (relationshipState?.momentumTrend === "declining") {
      stallReasons.push("momentum declining");
    }
    if (emailSignals?.hasOpenLoops) {
      stallReasons.push("open loops");
    }
    if (emailSignals?.hasUnansweredAsks) {
      stallReasons.push("unanswered asks");
    }
    if (stallReasons.length > 0) {
      reasons.push(`stall risk (${stallReasons.join(", ")})`);
    } else {
      reasons.push("stall risk");
    }
  }
  // Note: Value assessment should match signals matrix calculation
  // For now, we use a simple heuristic, but the API route calculates
  // urgency_value_label separately using the signals calculator for display
  if (value >= 10) {
    reasons.push("high value relationship");
  } else if (value >= 5) {
    reasons.push("medium value relationship");
  } else {
    reasons.push("low value relationship");
  }
  if (effortBias >= 10) {
    reasons.push("low effort");
  }
  
  // Remove numeric score from reason (per NEX-46: remove score from UI)
  // Keep qualitative information only
  const reason =
    reasons.length > 0
      ? reasons.join(", ")
      : "Standard priority";
  
  return {
    actionId: action.id,
    score: total,
    breakdown: {
      urgency,
      stallRisk,
      value,
      effortBias,
      total,
    },
    reason,
  };
}

/**
 * Select the best action from a list of scored actions.
 */
export function selectBestAction(
  scoredActions: ScoredAction[]
): ScoredAction | null {
  if (scoredActions.length === 0) {
    return null;
  }
  
  // Sort by score (descending), then by action ID for determinism
  const sorted = [...scoredActions].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.actionId.localeCompare(b.actionId);
  });
  
  return sorted[0];
}

