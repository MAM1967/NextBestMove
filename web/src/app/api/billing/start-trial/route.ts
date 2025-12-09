import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { stripe, getPriceId, getPlanMetadata } from "@/lib/billing/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

/**
 * POST /api/billing/start-trial
 * 
 * Creates a 14-day free trial subscription without requiring payment information.
 * This bypasses Stripe Checkout and creates the subscription directly.
 */
export async function POST(request: Request) {
  try {
    // Stripe instance will validate key on access, so we don't need to check here
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { plan = "standard", interval = "month" } = body;

    // Validate plan and interval
    if (!["standard", "premium"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'standard' or 'premium'" },
        { status: 400 }
      );
    }

    if (!["month", "year"].includes(interval)) {
      return NextResponse.json(
        { error: "Invalid interval. Must be 'month' or 'year'" },
        { status: 400 }
      );
    }

    const priceId = getPriceId(plan, interval);
    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID not configured for this plan" },
        { status: 500 }
      );
    }

    const planMetadata = getPlanMetadata(plan, interval);
    if (!planMetadata) {
      return NextResponse.json(
        { error: "Plan metadata not found" },
        { status: 500 }
      );
    }

    // Get or create Stripe customer
    let customerId: string;
    let billingCustomerId: string;
    const adminClient = createAdminClient();

    const { data: existingCustomer } = await adminClient
      .from("billing_customers")
      .select("id, stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingCustomer?.stripe_customer_id) {
      customerId = existingCustomer.stripe_customer_id;
      billingCustomerId = existingCustomer.id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;

      // Store in database using admin client (bypasses RLS)
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
        console.error("Error inserting billing customer:", insertError);
        return NextResponse.json(
          { error: "Failed to save customer record", details: insertError?.message },
          { status: 500 }
        );
      }

      billingCustomerId = newCustomer.id;
    }

    // Create subscription with 14-day trial (no payment method required)
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

    // Use type guards to safely access Stripe.Subscription properties
    const currentPeriodEnd = 'current_period_end' in subscription && 
      typeof subscription.current_period_end === 'number'
      ? subscription.current_period_end
      : null;
    const status = 'status' in subscription ? subscription.status : null;
    const trialEnd = 'trial_end' in subscription ? subscription.trial_end : null;

    console.log("📅 Trial subscription created:", {
      subscriptionId: subscription.id,
      trial_end: trialEnd,
      trialEndsAt,
      current_period_end: currentPeriodEnd,
      status: status,
    });

    // Cancel any other active/trialing subscriptions for this customer
    // This ensures only one active subscription per customer
    await adminClient
      .from("billing_subscriptions")
      .update({
        status: "canceled",
        cancel_at_period_end: false,
      })
      .eq("billing_customer_id", billingCustomerId)
      .in("status", ["active", "trialing"]);

    // Store subscription in database using admin client
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
      // Don't fail the request - subscription is created in Stripe
    }

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      trialEndsAt,
    });
  } catch (error: any) {
    console.error("Error starting trial:", error);
    return NextResponse.json(
      { error: "Failed to start trial", details: error.message },
      { status: 500 }
    );
  }
}

