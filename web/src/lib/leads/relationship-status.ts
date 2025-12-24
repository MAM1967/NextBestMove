/**
 * Relationship status computation utilities
 * 
 * Computes relationship status badges: "Needs attention" / "In rhythm" / "Intentional low-touch"
 * Based on cadence, last_interaction_at, next_touch_due_at, and other factors.
 */

export type RelationshipCadence = "frequent" | "moderate" | "infrequent" | "ad_hoc";
export type RelationshipTier = "inner" | "active" | "warm" | "background";
export type RelationshipStatus = "needs_attention" | "in_rhythm" | "intentional_low_touch";

export interface RelationshipStatusInput {
  cadence: RelationshipCadence | null;
  tier: RelationshipTier | null;
  last_interaction_at: string | null;
  next_touch_due_at: string | null;
  cadence_days: number | null;
  overdue_actions_count?: number;
}

/**
 * Get cadence days default (lower bound of range) when cadence_days is not specified
 * Based on updated ranges from ICP interview feedback
 */
export function getCadenceDaysDefault(cadence: RelationshipCadence | null): number | null {
  switch (cadence) {
    case "frequent":
      return 7; // Lower bound of 7-14 day range
    case "moderate":
      return 30; // Lower bound of 30-90 day range
    case "infrequent":
      return 180; // Lower bound of 180-365 day range
    case "ad_hoc":
      return null;
    default:
      return null;
  }
}

/**
 * Get cadence range bounds
 */
export function getCadenceRange(cadence: RelationshipCadence | null): { min: number; max: number } | null {
  switch (cadence) {
    case "frequent":
      return { min: 7, max: 14 };
    case "moderate":
      return { min: 30, max: 90 };
    case "infrequent":
      return { min: 180, max: 365 };
    case "ad_hoc":
      return null;
    default:
      return null;
  }
}

/**
 * Validate cadence days are within the range for the cadence
 */
export function validateCadenceDays(cadence: RelationshipCadence | null, days: number | null): boolean {
  if (!cadence || cadence === "ad_hoc" || days === null) {
    return true; // Ad-hoc or null is valid
  }
  
  const range = getCadenceRange(cadence);
  if (!range) {
    return false;
  }
  
  return days >= range.min && days <= range.max;
}

/**
 * Compute next_touch_due_at from last_interaction_at and cadence_days
 * Uses cadence_days directly (user-specified value within range)
 */
export function computeNextTouchDueAt(
  lastInteractionAt: string | null,
  cadenceDays: number | null
): string | null {
  if (!lastInteractionAt || !cadenceDays) {
    return null;
  }

  const lastInteraction = new Date(lastInteractionAt);
  const nextTouch = new Date(lastInteraction);
  nextTouch.setDate(nextTouch.getDate() + cadenceDays);
  
  return nextTouch.toISOString();
}

/**
 * Compute relationship status badge
 * 
 * Logic:
 * - "Needs attention": overdue for touch, past cadence window, or has overdue actions
 * - "In rhythm": due soon/on time, within cadence window, no overdue actions
 * - "Intentional low-touch": ad_hoc cadence, infrequent due in 7+ days, or background tier
 */
export function computeRelationshipStatus(
  input: RelationshipStatusInput
): RelationshipStatus {
  const {
    cadence,
    tier,
    last_interaction_at,
    next_touch_due_at,
    cadence_days,
    overdue_actions_count = 0,
  } = input;

  const now = new Date();

  // Ad-hoc cadence is always intentional low-touch
  if (cadence === "ad_hoc") {
    return "intentional_low_touch";
  }

  // Background tier is intentional low-touch
  if (tier === "background") {
    return "intentional_low_touch";
  }

  // Has overdue actions -> needs attention
  if (overdue_actions_count > 0) {
    return "needs_attention";
  }

  // No last interaction -> needs attention (should initiate)
  if (!last_interaction_at) {
    return "needs_attention";
  }

  // Check if next touch is overdue
  if (next_touch_due_at) {
    const nextTouch = new Date(next_touch_due_at);
    if (nextTouch < now) {
      return "needs_attention";
    }
  }

  // Check if past cadence window
  if (cadence_days && last_interaction_at) {
    const lastInteraction = new Date(last_interaction_at);
    const daysSinceInteraction = Math.floor(
      (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Significantly past cadence (2x or more) -> needs attention
    if (daysSinceInteraction > cadence_days * 2) {
      return "needs_attention";
    }
  }

  // Check if in rhythm (due soon or on time)
  if (next_touch_due_at) {
    const nextTouch = new Date(next_touch_due_at);
    const daysUntilNextTouch = Math.floor(
      (nextTouch.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Due within 3 days and not overdue -> in rhythm
    if (daysUntilNextTouch >= 0 && daysUntilNextTouch <= 3) {
      // Also check we're within cadence window
      if (cadence_days && last_interaction_at) {
        const lastInteraction = new Date(last_interaction_at);
        const daysSinceInteraction = Math.floor(
          (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceInteraction <= cadence_days) {
          return "in_rhythm";
        }
      } else {
        return "in_rhythm";
      }
    }
  }

  // Infrequent cadence due in 7+ days -> intentional low-touch
  if (cadence === "infrequent" && next_touch_due_at) {
    const nextTouch = new Date(next_touch_due_at);
    const daysUntilNextTouch = Math.floor(
      (nextTouch.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilNextTouch > 7) {
      return "intentional_low_touch";
    }
  }

  // Default to needs attention if we can't determine
  return "needs_attention";
}

/**
 * Get status badge label
 */
export function getStatusLabel(status: RelationshipStatus): string {
  switch (status) {
    case "needs_attention":
      return "Needs attention";
    case "in_rhythm":
      return "In rhythm";
    case "intentional_low_touch":
      return "Intentional low-touch";
    default:
      return "Unknown";
  }
}

/**
 * Get status badge styling classes
 */
export function getStatusBadgeClasses(status: RelationshipStatus): string {
  switch (status) {
    case "needs_attention":
      return "bg-red-100 text-red-800 border-red-200";
    case "in_rhythm":
      return "bg-green-100 text-green-800 border-green-200";
    case "intentional_low_touch":
      return "bg-zinc-100 text-zinc-600 border-zinc-200";
    default:
      return "bg-zinc-100 text-zinc-600 border-zinc-200";
  }
}

/**
 * Get cadence label
 */
export function getCadenceLabel(cadence: RelationshipCadence | null): string {
  switch (cadence) {
    case "frequent":
      return "Frequent (weekly)";
    case "moderate":
      return "Moderate (bi-weekly)";
    case "infrequent":
      return "Infrequent (monthly)";
    case "ad_hoc":
      return "Ad-hoc";
    default:
      return "Not set";
  }
}

/**
 * Get tier label
 */
export function getTierLabel(tier: RelationshipTier | null): string {
  switch (tier) {
    case "inner":
      return "Inner";
    case "active":
      return "Active";
    case "warm":
      return "Warm";
    case "background":
      return "Background";
    default:
      return "Not set";
  }
}

