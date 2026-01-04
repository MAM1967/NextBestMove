/**
 * Utility functions for checking subscription status and grace period
 */

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "grace_period" | "none";

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  trialEndsAt: Date | null;
  isInGracePeriod: boolean;
  gracePeriodEndsAt: Date | null;
  daysUntilGracePeriodEnds: number | null;
}

/**
 * Check if user is in grace period (trial ended, no subscription, within 7 days)
 * Grace period: Day 15-21 (7 days after trial ends)
 */
export function checkGracePeriod(trialEndsAt: string | null | undefined): {
  isInGracePeriod: boolean;
  gracePeriodEndsAt: Date | null;
  daysUntilGracePeriodEnds: number | null;
} {
  if (!trialEndsAt) {
    return {
      isInGracePeriod: false,
      gracePeriodEndsAt: null,
      daysUntilGracePeriodEnds: null,
    };
  }

  const trialEnd = new Date(trialEndsAt);
  const now = new Date();
  const gracePeriodEnd = new Date(trialEnd);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7); // 7 days after trial ends

  // Check if we're in grace period (trial ended but within 7 days)
  const isInGracePeriod = now >= trialEnd && now <= gracePeriodEnd;

  // Calculate days until grace period ends
  const daysUntilGracePeriodEnds = isInGracePeriod
    ? Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    isInGracePeriod,
    gracePeriodEndsAt: isInGracePeriod ? gracePeriodEnd : null,
    daysUntilGracePeriodEnds,
  };
}

/**
 * Get subscription status with grace period check
 */
export function getSubscriptionStatus(
  subscriptionStatus: "trialing" | "active" | "past_due" | "canceled" | null,
  trialEndsAt: string | null | undefined
): SubscriptionStatus {
  if (!subscriptionStatus) {
    // Check if in grace period
    const { isInGracePeriod } = checkGracePeriod(trialEndsAt);
    return isInGracePeriod ? "grace_period" : "none";
  }

  // If subscription is canceled or doesn't exist, check grace period
  if (subscriptionStatus === "canceled") {
    const { isInGracePeriod } = checkGracePeriod(trialEndsAt);
    return isInGracePeriod ? "grace_period" : "canceled";
  }

  return subscriptionStatus;
}

/**
 * Get comprehensive subscription info
 */
export function getSubscriptionInfo(
  subscriptionStatus: "trialing" | "active" | "past_due" | "canceled" | null,
  trialEndsAt: string | null | undefined
): SubscriptionInfo {
  const { isInGracePeriod, gracePeriodEndsAt, daysUntilGracePeriodEnds } =
    checkGracePeriod(trialEndsAt);

  const status = getSubscriptionStatus(subscriptionStatus, trialEndsAt);

  return {
    status,
    trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : null,
    isInGracePeriod,
    gracePeriodEndsAt,
    daysUntilGracePeriodEnds,
  };
}

/**
 * Check if user has active access (trialing, active, or in grace period)
 */
export function hasActiveAccess(
  subscriptionStatus: "trialing" | "active" | "past_due" | "canceled" | null,
  trialEndsAt: string | null | undefined
): boolean {
  const status = getSubscriptionStatus(subscriptionStatus, trialEndsAt);
  return status === "trialing" || status === "active" || status === "grace_period";
}

/**
 * Check if user can generate new plans (active or trialing only, not grace period)
 * Free tier users can only generate manually (not automatically via cron)
 */
export async function canGeneratePlans(
  subscriptionStatus: "trialing" | "active" | "past_due" | "canceled" | null,
  trialEndsAt: string | null | undefined,
  userTier?: "free" | "standard" | "premium" | null
): Promise<boolean> {
  // Free tier: manual generation only (not automatic)
  if (userTier === "free") {
    return false;
  }
  
  const status = getSubscriptionStatus(subscriptionStatus, trialEndsAt);
  // Grace period is read-only, so only trialing and active can generate
  return status === "trialing" || status === "active";
}

/**
 * Synchronous version for backward compatibility
 * Note: This doesn't check tier - use async version for tier-aware checks
 */
export function canGeneratePlansSync(
  subscriptionStatus: "trialing" | "active" | "past_due" | "canceled" | null,
  trialEndsAt: string | null | undefined
): boolean {
  const status = getSubscriptionStatus(subscriptionStatus, trialEndsAt);
  // Trial expiration downgrades to Free tier (not read-only), so only trialing and active can generate
  return status === "trialing" || status === "active";
}

