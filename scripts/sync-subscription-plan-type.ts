/**
 * Script to sync plan_type in database based on Stripe price_id
 *
 * This is useful when:
 * - Subscription was manually changed in Stripe
 * - Metadata wasn't set correctly in Stripe
 * - Need to verify/update plan_type after subscription change
 *
 * Usage: npx tsx scripts/sync-subscription-plan-type.ts <email>
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Load environment variables from .env.local
const envPath = resolve(__dirname, "../web/.env.local");
try {
  const envFile = readFileSync(envPath, "utf-8");
  envFile.split("\n").forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
  console.log("✅ Loaded environment variables from .env.local");
} catch (error) {
  console.warn("⚠️ Could not load .env.local, using environment variables");
  console.warn("   Make sure web/.env.local exists with required variables");
}

import { createAdminClient } from "../web/src/lib/supabase/admin";
import { stripe } from "../web/src/lib/billing/stripe";

async function syncPlanType(email: string) {
  const supabase = createAdminClient();

  // Try to get subscription via user lookup first (more reliable)
  let subscription: any = null;

  // Method 1: Get user, then customer, then subscription
  const { data: user } = await supabase
    .from("users")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  if (user) {
    const { data: customer } = await supabase
      .from("billing_customers")
      .select("id, stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (customer) {
      const { data: sub } = await supabase
        .from("billing_subscriptions")
        .select("id, stripe_subscription_id, stripe_price_id, metadata, status")
        .eq("billing_customer_id", customer.id)
        .in("status", ["active", "trialing"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sub) {
        subscription = sub;
      }
    }
  }

  // Method 2: If not found, try direct query by stripe_subscription_id from Stripe
  if (!subscription) {
    console.warn(`Could not find subscription via user lookup for ${email}`);
    console.warn("Attempting to find subscription via Stripe customer lookup...");
    
    // We can't easily do this without the Stripe customer ID, so just error
    console.error(`User not found: ${email}`);
    console.error("Tip: The user may not exist in the users table, or the email may be different");
    console.error("You can fix this directly in the database using fix_premium_plan_direct.sql");
    process.exit(1);
  }

  console.log("Current subscription in database:");
  console.log({
    stripe_subscription_id: subscription.stripe_subscription_id,
    stripe_price_id: subscription.stripe_price_id,
    current_plan_type: (subscription.metadata as any)?.plan_type,
    current_plan_name: (subscription.metadata as any)?.plan_name,
    status: subscription.status,
  });

  // Get subscription from Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(
    subscription.stripe_subscription_id
  );

  console.log("\nStripe subscription metadata:");
  console.log(stripeSubscription.metadata);

  // Determine plan_type from price_id using shared utility
  const { getPlanFromPriceId } = await import("../web/src/lib/billing/plan-detection");
  const planInfo = getPlanFromPriceId(subscription.stripe_price_id);
  const planType = planInfo.plan_type;
  const planName = planInfo.plan_name;
  const interval = planInfo.interval;

  console.log(`\nDetermined plan from price_id:`);
  console.log({
    plan_type: planType,
    plan_name: planName,
    interval,
  });

  // Check if update is needed
  const currentPlanType = (subscription.metadata as any)?.plan_type;
  if (currentPlanType === planType) {
    console.log("\n✅ Plan type is already correct. No update needed.");
    return;
  }

  // Update metadata
  console.log(
    `\nUpdating plan_type from "${currentPlanType}" to "${planType}"...`
  );

  const { error } = await supabase
    .from("billing_subscriptions")
    .update({
      metadata: {
        ...(subscription.metadata as any),
        plan_type: planType,
        plan_name: planName,
        interval,
      },
    })
    .eq("id", subscription.id);

  if (error) {
    console.error("Error updating subscription:", error);
    process.exit(1);
  }

  console.log("✅ Successfully updated plan_type in database!");
  console.log("\nUpdated subscription:");
  const { data: updated } = await supabase
    .from("billing_subscriptions")
    .select("metadata")
    .eq("id", subscription.id)
    .single();

  console.log(updated?.metadata);
}

// Run script
const email = process.argv[2];
if (!email) {
  console.error(
    "Usage: npx tsx scripts/sync-subscription-plan-type.ts <email>"
  );
  process.exit(1);
}

syncPlanType(email)
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
