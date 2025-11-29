import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { stripe, getPriceId, getPlanMetadata } from "@/lib/billing/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/billing/start-trial
 * 
 * Creates a 14-day free trial subscription without requiring payment information.
 * This bypasses Stripe Checkout and creates the subscription directly.
 */
export async function POST(request: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe configuration error", details: "STRIPE_SECRET_KEY is not set" },
        { status: 500 }
      );
    }

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
    if (!["standard", "professional"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'standard' or 'professional'" },
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
    const adminClient = createAdminClient();

    const { data: existingCustomer } = await adminClient
      .from("billing_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingCustomer?.stripe_customer_id) {
      customerId = existingCustomer.stripe_customer_id;
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
      const { error: insertError } = await adminClient
        .from("billing_customers")
        .insert({
          user_id: user.id,
          stripe_customer_id: customerId,
          currency: "usd",
        });

      if (insertError) {
        console.error("Error inserting billing customer:", insertError);
        return NextResponse.json(
          { error: "Failed to save customer record", details: insertError.message },
          { status: 500 }
        );
      }
    }

    // Create subscription with 14-day trial (no payment method required)
    const subscription = await stripe.subscriptions.create({
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

    // Store subscription in database using admin client
    const { error: subError } = await adminClient
      .from("billing_subscriptions")
      .upsert(
        {
          billing_customer_id: existingCustomer?.id || (
            await adminClient
              .from("billing_customers")
              .select("id")
              .eq("stripe_customer_id", customerId)
              .single()
          ).data?.id,
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

