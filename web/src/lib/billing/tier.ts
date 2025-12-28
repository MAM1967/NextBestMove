/**
 * Tier Management Utilities
 * 
 * Handles Free/Standard/Premium tier logic for the reverse trial model.
 * All users start on Standard for 14 days, then downgrade to Free unless they upgrade.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getPlanFromPriceId } from "./plan-detection";

export type UserTier = "free" | "standard" | "premium";

/**
 * Compute user tier from subscription status and plan type.
 * 
 * Logic:
 * - If user has active/trialing subscription with plan_type → use that tier
 * - If trial ended and no active subscription → Free tier
 * - If no subscription at all → Free tier
 */
export async function computeUserTier(
  supabase: SupabaseClient,
  userId: string
): Promise<UserTier> {
  // Get user's billing customer
  const { data: billingCustomer } = await supabase
    .from("billing_customers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!billingCustomer) {
    return "free";
  }

  // Get active/trialing subscription
  const { data: subscription } = await supabase
    .from("billing_subscriptions")
    .select("status, trial_ends_at, metadata, stripe_price_id")
    .eq("billing_customer_id", billingCustomer.id)
    .in("status", ["trialing", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subscription) {
    return "free";
  }

  // If subscription is active (not just trialing), determine tier from plan
  if (subscription.status === "active") {
    const planInfo = getPlanFromPriceId(subscription.stripe_price_id);
    return planInfo.plan_type === "premium" ? "premium" : "standard";
  }

  // If trialing, check if trial has ended
  if (subscription.status === "trialing") {
    if (subscription.trial_ends_at) {
      const trialEnd = new Date(subscription.trial_ends_at);
      const now = new Date();
      
      // If trial has ended, check if there's a paid subscription
      if (now >= trialEnd) {
        // Trial ended - check if there's an active paid subscription
        const { data: activeSubscription } = await supabase
          .from("billing_subscriptions")
          .select("status, metadata, stripe_price_id")
          .eq("billing_customer_id", billingCustomer.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (activeSubscription) {
          const planInfo = getPlanFromPriceId(activeSubscription.stripe_price_id);
          return planInfo.plan_type === "premium" ? "premium" : "standard";
        }
        
        // No active subscription → Free tier
        return "free";
      }
    }
    
    // Still in trial → Standard tier (all trials are Standard)
    return "standard";
  }

  return "free";
}

/**
 * Update user tier in database.
 * This should be called whenever subscription status changes.
 */
export async function updateUserTier(
  supabase: SupabaseClient,
  userId: string
): Promise<UserTier> {
  const tier = await computeUserTier(supabase, userId);
  
  const { error } = await supabase
    .from("users")
    .update({ tier })
    .eq("id", userId);
  
  if (error) {
    console.error("Error updating user tier:", error);
    throw new Error(`Failed to update user tier: ${error.message}`);
  }
  
  return tier;
}

/**
 * Check if user should be downgraded to Free tier (Day 15 logic).
 * 
 * This checks if:
 * - Trial has ended (trial_ends_at < now)
 * - No active paid subscription exists
 * 
 * Returns true if user should be downgraded to Free.
 */
export async function shouldDowngradeToFree(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: billingCustomer } = await supabase
    .from("billing_customers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!billingCustomer) {
    return true; // No customer = Free tier
  }

  // Check for ended trial
  const { data: endedTrial } = await supabase
    .from("billing_subscriptions")
    .select("trial_ends_at")
    .eq("billing_customer_id", billingCustomer.id)
    .eq("status", "trialing")
    .not("trial_ends_at", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!endedTrial || !endedTrial.trial_ends_at) {
    return false; // No trial to check
  }

  const trialEnd = new Date(endedTrial.trial_ends_at);
  const now = new Date();

  // If trial hasn't ended yet, don't downgrade
  if (now < trialEnd) {
    return false;
  }

  // Trial has ended - check if there's an active paid subscription
  const { data: activeSubscription } = await supabase
    .from("billing_subscriptions")
    .select("id")
    .eq("billing_customer_id", billingCustomer.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // If no active subscription, should downgrade to Free
  return !activeSubscription;
}

/**
 * Get user tier from database (cached value).
 * For real-time tier, use computeUserTier instead.
 */
export async function getUserTier(
  supabase: SupabaseClient,
  userId: string
): Promise<UserTier> {
  const { data: user } = await supabase
    .from("users")
    .select("tier")
    .eq("id", userId)
    .single();

  return (user?.tier as UserTier) || "free";
}






