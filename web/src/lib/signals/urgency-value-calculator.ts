/**
 * Urgency/Value Calculator for 2x2 Matrix
 * 
 * Calculates urgency and value scores for relationships to position them
 * in a 2x2 matrix (Low/Low, Low/High, High/Low, High/High).
 * 
 * NEX-52: Signals 2x2 Urgency/Value Matrix
 */

export type UrgencyLevel = "low" | "high";
export type ValueLevel = "low" | "high";

export interface UrgencyValueInput {
  daysSinceLastInteraction: number;
  overdueActionsCount: number;
  hasUrgentEmailSentiment: boolean;
  hasOpenLoops: boolean;
  tier: "inner" | "active" | "warm" | "background" | null;
  responseRate: number; // 0-1 (percentage of actions that got replies)
  hasDealPotential: boolean; // In OPPORTUNITY state
}

export interface UrgencyValueResult {
  urgency: UrgencyLevel;
  value: ValueLevel;
  urgencyScore: number; // 0-100 for debugging
  valueScore: number; // 0-100 for debugging
  quadrant: "low-low" | "low-high" | "high-low" | "high-high";
  label: string; // Human-readable label like "High urgency, high value relationship"
}

/**
 * Calculate urgency level based on days since interaction, overdue actions, and email signals
 */
export function calculateUrgency(input: UrgencyValueInput): UrgencyLevel {
  let urgencyScore = 0;

  // Days since last interaction (0-50 points)
  // More days = higher urgency (up to 30 days, then plateaus)
  if (input.daysSinceLastInteraction > 30) {
    urgencyScore += 50;
  } else if (input.daysSinceLastInteraction > 14) {
    urgencyScore += 40;
  } else if (input.daysSinceLastInteraction > 7) {
    urgencyScore += 30;
  } else if (input.daysSinceLastInteraction > 3) {
    urgencyScore += 20;
  } else if (input.daysSinceLastInteraction > 0) {
    urgencyScore += 10;
  }

  // Overdue actions (0-30 points)
  // More overdue actions = higher urgency
  urgencyScore += Math.min(input.overdueActionsCount * 10, 30);

  // Email signals (0-20 points)
  if (input.hasUrgentEmailSentiment) {
    urgencyScore += 15;
  }
  if (input.hasOpenLoops) {
    urgencyScore += 5;
  }

  // Threshold: 50+ = high urgency
  return urgencyScore >= 50 ? "high" : "low";
}

/**
 * Calculate value level based on tier, response rate, and deal potential
 */
export function calculateValue(input: UrgencyValueInput): ValueLevel {
  let valueScore = 0;

  // Tier (0-40 points)
  switch (input.tier) {
    case "inner":
      valueScore += 40;
      break;
    case "active":
      valueScore += 30;
      break;
    case "warm":
      valueScore += 20;
      break;
    case "background":
      valueScore += 10;
      break;
    default:
      valueScore += 15; // Default to medium-low
  }

  // Response rate (0-30 points)
  // Higher response rate = higher value
  valueScore += input.responseRate * 30;

  // Deal potential (0-30 points)
  if (input.hasDealPotential) {
    valueScore += 30;
  }

  // Threshold: 50+ = high value
  return valueScore >= 50 ? "high" : "low";
}

/**
 * Calculate both urgency and value, return quadrant and label
 */
export function calculateUrgencyValue(
  input: UrgencyValueInput
): UrgencyValueResult {
  // Calculate raw scores first
  let urgencyScore = 0;
  let valueScore = 0;

  // Urgency calculation
  if (input.daysSinceLastInteraction > 30) {
    urgencyScore += 50;
  } else if (input.daysSinceLastInteraction > 14) {
    urgencyScore += 40;
  } else if (input.daysSinceLastInteraction > 7) {
    urgencyScore += 30;
  } else if (input.daysSinceLastInteraction > 3) {
    urgencyScore += 20;
  } else if (input.daysSinceLastInteraction > 0) {
    urgencyScore += 10;
  }
  urgencyScore += Math.min(input.overdueActionsCount * 10, 30);
  if (input.hasUrgentEmailSentiment) {
    urgencyScore += 15;
  }
  if (input.hasOpenLoops) {
    urgencyScore += 5;
  }

  // Value calculation
  switch (input.tier) {
    case "inner":
      valueScore += 40;
      break;
    case "active":
      valueScore += 30;
      break;
    case "warm":
      valueScore += 20;
      break;
    case "background":
      valueScore += 10;
      break;
    default:
      valueScore += 15;
  }
  valueScore += input.responseRate * 30;
  if (input.hasDealPotential) {
    valueScore += 30;
  }

  const urgency: UrgencyLevel = urgencyScore >= 50 ? "high" : "low";
  const value: ValueLevel = valueScore >= 50 ? "high" : "low";

  // Determine quadrant
  let quadrant: "low-low" | "low-high" | "high-low" | "high-high";
  let label: string;

  if (urgency === "high" && value === "high") {
    quadrant = "high-high";
    label = "High urgency, high value relationship";
  } else if (urgency === "high" && value === "low") {
    quadrant = "high-low";
    label = "High urgency, low value relationship";
  } else if (urgency === "low" && value === "high") {
    quadrant = "low-high";
    label = "Low urgency, high value relationship";
  } else {
    quadrant = "low-low";
    label = "Low urgency, low value relationship";
  }

  return {
    urgency,
    value,
    urgencyScore,
    valueScore,
    quadrant,
    label,
  };
}

