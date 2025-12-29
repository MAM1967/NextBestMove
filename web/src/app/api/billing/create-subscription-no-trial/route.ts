import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { stripe, getPriceId, getPlanMetadata } from "@/lib/billing/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateIdempotencyKey, executeWithIdempotency } from "@/lib/billing/idempotency";
import Stripe from "stripe";

/**
 * POST /api/billing/create-subscription-no-trial
 * 
 * TESTING ONLY: Creates an active subscription without a trial period.
 * This bypasses the trial and creates an immediate paid subscription.
 * 
 * WARNING: This endpoint should be protected or removed in production.
 * For production, use /api/billing/create-checkout-session with isTrial=false.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { plan = "standard", interval = "month", paymentMethodId } = body;

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

    // Payment method is required for non-trial subscriptions
    if (!paymentMethodId) {
      return NextResponse.json(
        { error: "paymentMethodId is required for subscriptions without trial" },
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
      // Create new Stripe customer with idempotency key
      const customerIdempotencyKey = generateIdempotencyKey(user.id, "create_customer", {
        email: user.email,
      });
      const customer = await stripe.customers.create(
        {
          email: user.email,
          metadata: {
            user_id: user.id,
          },
        },
        {
          idempotencyKey: customerIdempotencyKey.substring(0, 255), // Stripe limit is 255 chars
        }
      );
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
        console.error("Error inserting billing customer:", insertError);
        return NextResponse.json(
          { error: "Failed to save customer record", details: insertError?.message },
          { status: 500 }
        );
      }

      billingCustomerId = newCustomer.id;
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Generate idempotency key for this operation
    const idempotencyKey = generateIdempotencyKey(user.id, "create_subscription_no_trial", {
      customerId,
      priceId,
      plan,
      interval,
      paymentMethodId,
    });

    // Create subscription WITHOUT trial period with idempotency protection
    const subscription: Stripe.Subscription = await executeWithIdempotency(
      idempotencyKey,
      async () => {
        return await stripe.subscriptions.create(
          {
            customer: customerId,
            items: [{ price: priceId }],
            payment_behavior: "default_incomplete",
            payment_settings: {
              payment_method_types: ["card"],
              save_default_payment_method: "on_subscription",
            },
            metadata: {
              user_id: user.id,
              plan_name: planMetadata.name,
              plan_type: plan,
              interval: interval,
            },
          },
          {
            idempotencyKey: idempotencyKey.substring(0, 255), // Stripe limit is 255 chars
          }
        );
      }
    );

    // Use type guards to safely access Stripe.Subscription properties
    const currentPeriodEnd = 'current_period_end' in subscription && 
      typeof subscription.current_period_end === 'number'
      ? subscription.current_period_end
      : null;
    const status = 'status' in subscription ? subscription.status : null;

    console.log("📅 Active subscription created (no trial):", {
      subscriptionId: subscription.id,
      current_period_end: currentPeriodEnd,
      status: status,
    });

    // Cancel any other active/trialing subscriptions for this customer
    await adminClient
      .from("billing_subscriptions")
      .update({
        status: "canceled",
        cancel_at_period_end: false,
      })
      .eq("billing_customer_id", billingCustomerId)
      .in("status", ["active", "trialing"]);

    // Store subscription in database
    const currentPeriodEndDate = currentPeriodEnd
      ? new Date(currentPeriodEnd * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Fallback to 30 days

    const { error: subError } = await adminClient
      .from("billing_subscriptions")
      .upsert(
        {
          billing_customer_id: billingCustomerId,
          stripe_subscription_id: subscription.id,
          stripe_price_id: priceId,
          status: status === "active" || status === "trialing" ? status : "active",
          current_period_end: currentPeriodEndDate,
          cancel_at_period_end: false,
          trial_ends_at: null, // No trial
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
      status: status,
      currentPeriodEnd: currentPeriodEndDate,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error creating subscription:", errorMessage);
    return NextResponse.json(
      { error: "Failed to create subscription", details: errorMessage },
      { status: 500 }
    );
  }
}

