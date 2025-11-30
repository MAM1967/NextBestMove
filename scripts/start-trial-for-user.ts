#!/usr/bin/env tsx
/**
 * Script to manually start a free trial for a user
 * Usage: tsx scripts/start-trial-for-user.ts <email>
 * 
 * Make sure to set environment variables:
 * - STRIPE_SECRET_KEY
 * - SUPABASE_SERVICE_ROLE_KEY
 * - SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
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
} catch (error) {
  console.warn("Could not load .env.local, using environment variables");
}

import { createAdminClient } from "../web/src/lib/supabase/admin";
import { stripe, getPriceId, getPlanMetadata } from "../web/src/lib/billing/stripe";
import Stripe from "stripe";

async function startTrialForUser(email: string) {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  const adminClient = createAdminClient();

  // Find user by email
  const { data: user, error: userError } = await adminClient
    .from("users")
    .select("id, email")
    .eq("email", email)
    .single();

  if (userError || !user) {
    throw new Error(`User not found: ${email}`);
  }

  console.log(`Found user: ${user.id} (${user.email})`);

  // Get or create Stripe customer
  let customerId: string;
  let billingCustomerId: string;

  const { data: existingCustomer } = await adminClient
    .from("billing_customers")
    .select("id, stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingCustomer?.stripe_customer_id) {
    customerId = existingCustomer.stripe_customer_id;
    billingCustomerId = existingCustomer.id;
    console.log(`Using existing customer: ${customerId}`);
  } else {
    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        user_id: user.id,
      },
    });
    customerId = customer.id;

    // Store in database
    const { data: newCustomer, error: insertError } = await adminClient
      .from("billing_customers")
      .insert({
        user_id: user.id,
        stripe_customer_id: customerId,
        currency: "usd",
      })
      .select("id")
      .single();

    if (insertError || !newCustomer) {
      throw new Error(`Failed to save customer record: ${insertError?.message}`);
    }

    billingCustomerId = newCustomer.id;
    console.log(`Created new customer: ${customerId}`);
  }

  // Check if subscription already exists
  const { data: existingSubscription } = await adminClient
    .from("billing_subscriptions")
    .select("id, stripe_subscription_id, status")
    .eq("billing_customer_id", billingCustomerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingSubscription) {
    console.log(`Subscription already exists: ${existingSubscription.stripe_subscription_id} (status: ${existingSubscription.status})`);
    return;
  }

  // Create subscription with 14-day trial
  const plan = "standard";
  const interval = "month";
  const priceId = getPriceId(plan, interval);
  const planMetadata = getPlanMetadata(plan, interval);

  if (!priceId || !planMetadata) {
    throw new Error("Price ID or plan metadata not configured");
  }

  const subscription: Stripe.Subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: 14,
    payment_behavior: "default_incomplete",
    payment_settings: {
      payment_method_types: ["card"],
      save_default_payment_method: "off",
    },
    metadata: {
      user_id: user.id,
      plan_name: planMetadata.name,
      plan_type: plan,
      interval: interval,
    },
  });

  // Calculate trial end date
  const trialEndsAt = subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null;

  const currentPeriodEnd = 'current_period_end' in subscription && 
    typeof subscription.current_period_end === 'number'
    ? subscription.current_period_end
    : null;

  console.log("📅 Trial subscription created:", {
    subscriptionId: subscription.id,
    trialEndsAt,
    current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
  });

  // Store subscription in database
  const { error: subError } = await adminClient
    .from("billing_subscriptions")
    .upsert(
      {
        billing_customer_id: billingCustomerId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        status: "trialing",
        current_period_end: trialEndsAt || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false,
        trial_ends_at: trialEndsAt,
        metadata: {
          plan_name: planMetadata.name,
          plan_type: plan,
          interval: interval,
        },
      },
      { onConflict: "stripe_subscription_id" }
    );

  if (subError) {
    console.error("Error storing subscription:", subError);
    throw new Error(`Failed to store subscription: ${subError.message}`);
  }

  console.log("✅ Trial started successfully!");
}

// Run script
const email = process.argv[2];
if (!email) {
  console.error("Usage: tsx scripts/start-trial-for-user.ts <email>");
  process.exit(1);
}

startTrialForUser(email)
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error.message);
    process.exit(1);
  });

