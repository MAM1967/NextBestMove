import { createClient } from "@/lib/supabase/server";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "none";

export type PlanType = "standard" | "premium" | "none";

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  plan: PlanType;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  isReadOnly: boolean;
}

/**
 * Get subscription info for a user
 */
export async function getSubscriptionInfo(
  userId: string
): Promise<SubscriptionInfo> {
  const supabase = await createClient();

  // Get billing customer
  const { data: customer } = await supabase
    .from("billing_customers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!customer) {
    return {
      status: "none",
      plan: "none",
      trialEndsAt: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      isReadOnly: false,
    };
  }

  // Get active subscription (prefer active, fallback to most recent)
  const { data: activeSubscription } = await supabase
    .from("billing_subscriptions")
    .select("*")
    .eq("billing_customer_id", customer.id)
    .eq("status", "active")
    .maybeSingle();

  let subscription = activeSubscription;

  if (!subscription) {
    // Get most recent subscription (including trialing, canceled, etc.)
    const { data: latestSubscription } = await supabase
      .from("billing_subscriptions")
      .select("*, payment_failed_at")
      .eq("billing_customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    subscription = latestSubscription;
  }

  if (!subscription) {
    return {
      status: "none",
      plan: "none",
      trialEndsAt: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      isReadOnly: false,
    };
  }

  const status = subscription.status as SubscriptionStatus;
  const trialEndsAt = subscription.trial_ends_at
    ? new Date(subscription.trial_ends_at)
    : null;
  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end)
    : null;

  // Determine plan from metadata
  // Internal type is "premium" (display name is also "Premium")
  let plan: PlanType = "none";
  if (subscription.metadata) {
    const planType = (subscription.metadata as any)?.plan_type?.toLowerCase();
    const planName = (subscription.metadata as any)?.plan_name?.toLowerCase();
    if (planType === "standard" || planName === "standard") plan = "standard";
    // Support both "premium" and legacy "professional" for backward compatibility
    if (planType === "premium" || planType === "professional" || planName === "premium" || planName === "professional") {
      plan = "premium";
    }
  }

  // Check if in read-only mode
  // Read-only if:
  // 1. Trial expired but within 7-day grace period
  // 2. Payment failed 7+ days ago (Day 7-14 of payment failure recovery)
  const paymentFailedAt = subscription.payment_failed_at
    ? new Date(subscription.payment_failed_at)
    : null;
  
  const isTrialGracePeriod =
    status === "trialing" &&
    trialEndsAt !== null &&
    trialEndsAt < new Date() &&
    trialEndsAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const isPaymentFailureReadOnly =
    status === "past_due" &&
    paymentFailedAt !== null &&
    paymentFailedAt <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) &&
    paymentFailedAt > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const isReadOnly = isTrialGracePeriod || isPaymentFailureReadOnly;

  return {
    status,
    plan,
    trialEndsAt,
    currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
    isReadOnly,
  };
}

/**
 * Check if user has access to a feature
 */
export async function hasFeatureAccess(
  userId: string,
  feature: "daily_plan" | "weekly_summary" | "insights" | "content_prompts"
): Promise<boolean> {
  const subscription = await getSubscriptionInfo(userId);

  // No subscription = no access
  if (subscription.status === "none") {
    return false;
  }

  // Read-only mode = no write access (grace period or payment failure Day 7-14)
  if (subscription.isReadOnly) {
    return false;
  }

  // Active or trialing = full access
  if (subscription.status === "active" || subscription.status === "trialing") {
    return true;
  }

  // Past due (Day 0-6) = still has access (just needs to update payment)
  // Past due (Day 7-14) = read-only (handled above)
  // Canceled = no access
  if (subscription.status === "past_due") {
    return true; // Day 0-6: still has access, just needs payment update
  }

  return false;
}

/**
 * Check if user can access Premium feature
 */
export async function hasProfessionalFeature(
  userId: string,
  feature: "unlimited_pins" | "pattern_detection" | "pre_call_briefs" | "content_engine" | "performance_timeline"
): Promise<boolean> {
  const subscription = await getSubscriptionInfo(userId);

  // Must be on Premium plan
  if (subscription.plan !== "premium") {
    return false;
  }

  // Must be active or trialing (not read-only, past due, or canceled)
  if (
    subscription.status !== "active" &&
    subscription.status !== "trialing"
  ) {
    return false;
  }

  // Not in read-only mode
  if (subscription.isReadOnly) {
    return false;
  }

  return true;
}

/**
 * Check if user has reached pin limit (Standard plan = 50 pins max)
 */
export async function checkPinLimit(userId: string): Promise<{
  canAdd: boolean;
  currentCount: number;
  limit: number;
  plan: PlanType;
}> {
  const subscription = await getSubscriptionInfo(userId);
  const supabase = await createClient();

  // Count active pins
  const { count } = await supabase
    .from("person_pins")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "ACTIVE");

  const currentCount = count || 0;
  const limit = subscription.plan === "premium" ? Infinity : 50;
  const canAdd = currentCount < limit;

  return {
    canAdd,
    currentCount,
    limit,
    plan: subscription.plan,
  };
}


