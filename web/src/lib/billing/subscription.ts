import { createClient } from "@/lib/supabase/server";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "none";

export type PlanType = "standard" | "professional" | "none";

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
      .select("*")
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
  let plan: PlanType = "none";
  if (subscription.metadata) {
    const planName = (subscription.metadata as any)?.plan_name?.toLowerCase();
    if (planName === "standard") plan = "standard";
    if (planName === "professional") plan = "professional";
  }

  // Check if in read-only mode
  // Read-only if: trial expired but within 7-day grace period
  const isReadOnly =
    status === "trialing" &&
    trialEndsAt !== null &&
    trialEndsAt < new Date() &&
    trialEndsAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

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

  // Read-only mode = no write access
  if (subscription.isReadOnly) {
    return false;
  }

  // Active or trialing = full access
  if (subscription.status === "active" || subscription.status === "trialing") {
    return true;
  }

  // Past due or canceled = no access
  return false;
}

/**
 * Check if user can access Professional feature
 */
export async function hasProfessionalFeature(
  userId: string,
  feature: "unlimited_pins" | "pattern_detection" | "pre_call_briefs" | "content_engine" | "performance_timeline"
): Promise<boolean> {
  const subscription = await getSubscriptionInfo(userId);

  // Must be on Professional plan
  if (subscription.plan !== "professional") {
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
  const limit = subscription.plan === "professional" ? Infinity : 50;
  const canAdd = currentCount < limit;

  return {
    canAdd,
    currentCount,
    limit,
    plan: subscription.plan,
  };
}


