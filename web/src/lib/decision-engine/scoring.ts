/**
 * Decision Engine Scoring
 * 
 * Computes NextMoveScore for candidate actions.
 * Score components: Urgency, Stall Risk, Value, Effort Bias
 * Based on docs/Architecture/Decision_Engine_Implementation_Spec.md
 */

import type { RelationshipState } from "./state";

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
 */
function calculateUrgency(
  dueDate: Date,
  today: Date = new Date()
): number {
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const todayDate = new Date(today);
  todayDate.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor(
    (due.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Overdue → 40
  if (daysDiff < 0) {
    return 40;
  }
  
  // Due ≤ 2 days → 30
  if (daysDiff <= 2) {
    return 30;
  }
  
  // Due ≤ 7 days → 20
  if (daysDiff <= 7) {
    return 20;
  }
  
  // No due date or far out → 5
  return 5;
}

/**
 * Calculate stall risk score (0-25).
 */
function calculateStallRisk(
  relationshipState: RelationshipState | null
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
  },
  relationshipState: RelationshipState | null,
  today: Date = new Date()
): ScoredAction {
  const urgency = calculateUrgency(new Date(action.due_date), today);
  const stallRisk = calculateStallRisk(relationshipState);
  const value = calculateValue(relationshipState);
  const effortBias = calculateEffortBias(action.estimated_minutes || null);
  
  const total = urgency + stallRisk + value + effortBias;
  
  // Build reason string
  const reasons: string[] = [];
  if (urgency >= 30) {
    reasons.push("high urgency");
  }
  if (stallRisk > 0) {
    reasons.push("stall risk");
  }
  if (value >= 10) {
    reasons.push("high value relationship");
  }
  if (effortBias >= 10) {
    reasons.push("low effort");
  }
  
  const reason =
    reasons.length > 0
      ? `Score: ${total} (${reasons.join(", ")})`
      : `Score: ${total}`;
  
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

