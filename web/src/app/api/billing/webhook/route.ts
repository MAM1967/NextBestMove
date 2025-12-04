import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/billing/stripe";
import { headers } from "next/headers";
import Stripe from "stripe";
import { logWebhookEvent, logError, logBillingEvent } from "@/lib/utils/logger";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    logWebhookEvent("Missing stripe-signature header", {
      status: "error",
      webhookType: "stripe",
    });
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    logError("STRIPE_WEBHOOK_SECRET is not set", undefined, {
      context: "webhook_config",
    });
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    logWebhookEvent("Webhook signature verification failed", {
      status: "error",
      webhookType: "stripe",
      error: err.message,
    });
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Use admin client for webhook - no user auth context, need to bypass RLS
  const supabase = createAdminClient();

  // Store event for auditing
  try {
    await supabase.from("billing_events").insert({
      stripe_event_id: event.id,
      type: event.type,
      payload: event.data.object as any,
      processed_at: new Date().toISOString(),
    });
    logWebhookEvent("Billing event stored", {
      eventId: event.id,
      webhookType: "stripe",
      eventType: event.type,
      status: "success",
    });
  } catch (error) {
    logError("Error storing billing event", error, {
      eventId: event.id,
      eventType: event.type,
    });
    // Continue processing even if event storage fails
  }

  // Handle different event types
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabase, session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(supabase, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }

      case "invoice.paid": {
        // event.data.object may have expanded properties not in the base Invoice type
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        await handleInvoicePaid(supabase, invoice);
        break;
      }

      case "invoice.payment_failed": {
        // event.data.object may have expanded properties not in the base Invoice type
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        await handleInvoicePaymentFailed(supabase, invoice);
        break;
      }

      default:
        logWebhookEvent("Unhandled event type", {
          eventId: event.id,
          webhookType: "stripe",
          eventType: event.type,
          status: "warning",
        });
    }

    logWebhookEvent("Webhook processed successfully", {
      eventId: event.id,
      webhookType: "stripe",
      eventType: event.type,
      status: "success",
    });

    return NextResponse.json({ received: true });
  } catch (error: any) {
    logError("Error processing webhook", error, {
      eventId: event.id,
      eventType: event.type,
    });
    return NextResponse.json(
      { error: "Webhook processing failed", details: error.message },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(
  supabase: any,
  session: Stripe.Checkout.Session
) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  logBillingEvent("checkout.session.completed", {
    customerId,
    subscriptionId,
    eventId: session.id,
  });

  if (!customerId || !subscriptionId) {
    logError(
      "Missing customer or subscription ID in checkout session",
      undefined,
      {
        sessionId: session.id,
      }
    );
    return;
  }

  // Get customer from database
  const { data: customer, error: customerError } = await supabase
    .from("billing_customers")
    .select("id, user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (customerError) {
    logError("Error fetching customer", customerError, {
      customerId,
      sessionId: session.id,
    });
    return;
  }

  if (!customer) {
    logError("Customer not found in database", undefined, {
      customerId,
      sessionId: session.id,
    });
    return;
  }

  logBillingEvent("Customer found in database", {
    customerId,
    userId: customer.user_id,
    sessionId: session.id,
  });

  // Get subscription from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  logBillingEvent("Subscription retrieved from Stripe", {
    subscriptionId: subscription.id,
    status: subscription.status,
    customerId,
  });

  await handleSubscriptionUpdated(supabase, subscription, customer.id);
  logBillingEvent("Subscription updated in database", {
    subscriptionId: subscription.id,
    customerId,
  });
}

export async function handleSubscriptionUpdated(
  supabase: any,
  subscription: Stripe.Subscription,
  billingCustomerId?: string
) {
  // Get customer ID if not provided
  if (!billingCustomerId) {
    const { data: customer } = await supabase
      .from("billing_customers")
      .select("id")
      .eq("stripe_customer_id", subscription.customer as string)
      .maybeSingle();

    if (!customer) {
      logError("Customer not found for subscription update", undefined, {
        subscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
      });
      return;
    }
    billingCustomerId = customer.id;
  }

  // Extract plan metadata from subscription
  const priceId = subscription.items.data[0]?.price.id;
  const planMetadata = subscription.metadata || {};

  // Map Stripe status to our status enum
  let status: "trialing" | "active" | "past_due" | "canceled" = "active";
  if (subscription.status === "trialing") status = "trialing";
  else if (subscription.status === "past_due") status = "past_due";
  else if (
    subscription.status === "canceled" ||
    subscription.status === "unpaid"
  )
    status = "canceled";
  else if (subscription.status === "active") status = "active";

  // Upsert subscription
  // Use type guards to safely access Stripe.Subscription properties
  const currentPeriodEnd =
    subscription &&
    "current_period_end" in subscription &&
    typeof subscription.current_period_end === "number"
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : new Date().toISOString(); // Fallback to now if not available

  const cancelAtPeriodEnd =
    subscription && "cancel_at_period_end" in subscription
      ? subscription.cancel_at_period_end || false
      : false;

  const trialEndsAt =
    subscription && "trial_end" in subscription && subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null;

  logBillingEvent("Upserting subscription to database", {
    subscriptionId: subscription.id,
    status,
    priceId,
    billingCustomerId,
  });

  // Get old subscription BEFORE upsert to detect downgrades
  const { data: oldSubscriptionData } = await supabase
    .from("billing_subscriptions")
    .select("metadata")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  const oldPlanType = (oldSubscriptionData?.metadata as any)?.plan_type;
  const newPlanType = planMetadata.plan_type || "standard";

  const { data: upsertedData, error: upsertError } = await supabase
    .from("billing_subscriptions")
    .upsert(
      {
        billing_customer_id: billingCustomerId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        status: status,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: cancelAtPeriodEnd,
        trial_ends_at: trialEndsAt,
        latest_invoice_url: subscription.latest_invoice
          ? typeof subscription.latest_invoice === "string"
            ? null
            : (subscription.latest_invoice as Stripe.Invoice).hosted_invoice_url
          : null,
        metadata: {
          plan_name: planMetadata.plan_name || "Standard",
          plan_type: planMetadata.plan_type || "standard",
          interval: planMetadata.interval || "month",
          amount: subscription.items.data[0]?.price.unit_amount || 0,
        },
      },
      {
        onConflict: "stripe_subscription_id",
      }
    )
    .select();

  if (upsertError) {
    logError("Error upserting subscription", upsertError, {
      subscriptionId: subscription.id,
      billingCustomerId,
    });
    throw new Error(`Failed to save subscription: ${upsertError.message}`);
  }

  logBillingEvent("Subscription successfully saved to database", {
    subscriptionId: subscription.id,
    databaseId: upsertedData?.[0]?.id,
    billingCustomerId,
  });

  // Detect plan downgrade (Premium → Standard)
  if (upsertedData && upsertedData.length > 0) {

    // Check if downgrading from Premium to Standard
    if (
      (oldPlanType === "premium" || oldPlanType === "professional") &&
      newPlanType === "standard" &&
      status === "active"
    ) {
      // Get user ID to check pin count
      const { data: customer } = await supabase
        .from("billing_customers")
        .select("user_id")
        .eq("id", billingCustomerId)
        .single();

      if (customer) {
        // Check pin count
        const { count } = await supabase
          .from("person_pins")
          .select("*", { count: "exact", head: true })
          .eq("user_id", customer.user_id)
          .eq("status", "ACTIVE");

        const pinCount = count || 0;
        if (pinCount > 10) {
          // Store downgrade warning flag in metadata
          // Merge with existing metadata to preserve other fields
          const existingMetadata = upsertedData[0].metadata as any || {};
          await supabase
            .from("billing_subscriptions")
            .update({
              metadata: {
                ...existingMetadata,
                ...planMetadata,
                downgrade_warning_shown: false, // Frontend will check and show modal
                downgrade_pin_count: pinCount,
                downgrade_detected_at: new Date().toISOString(),
              },
            })
            .eq("id", upsertedData[0].id);

          logBillingEvent("Plan downgrade detected with pin limit exceeded", {
            subscriptionId: subscription.id,
            userId: customer.user_id,
            pinCount,
            oldPlan: oldPlanType,
            newPlan: newPlanType,
          });
        }
      }
    }
  }
}

async function handleSubscriptionDeleted(
  supabase: any,
  subscription: Stripe.Subscription
) {
  // Get existing subscription to preserve metadata
  const { data: existingSubscription } = await supabase
    .from("billing_subscriptions")
    .select("metadata")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  const existingMetadata = (existingSubscription?.metadata as any) || {};

  // Update subscription status to canceled and store canceled_at timestamp
  // This enables 30-day reactivation window
  await supabase
    .from("billing_subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: false,
      metadata: {
        ...existingMetadata,
        canceled_at: new Date().toISOString(),
      },
    })
    .eq("stripe_subscription_id", subscription.id);
}

async function handleInvoicePaid(
  supabase: any,
  invoice: Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  }
) {
  // Invoice.subscription can be a string ID or a Subscription object
  if (!invoice.subscription) return;

  const subscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription.id;
  if (!subscriptionId) return;

  // Get subscription from Stripe to update our records
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await handleSubscriptionUpdated(supabase, subscription);
}

async function handleInvoicePaymentFailed(
  supabase: any,
  invoice: Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  }
) {
  // Invoice.subscription can be a string ID or a Subscription object
  if (!invoice.subscription) return;

  const subscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription.id;
  if (!subscriptionId) return;

  // Get subscription to check if payment_failed_at is already set
  const { data: existingSubscription } = await supabase
    .from("billing_subscriptions")
    .select(
      "id, payment_failed_at, billing_customer_id, billing_customers!inner(user_id, users!inner(email, name))"
    )
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (!existingSubscription) {
    logError("Subscription not found for payment failure", undefined, {
      subscriptionId,
      invoiceId: invoice.id,
    });
    return;
  }

  const now = new Date().toISOString();
  const isFirstFailure = !existingSubscription.payment_failed_at;

  // Update subscription status to past_due and set payment_failed_at if first failure
  const updateData: any = {
    status: "past_due",
  };

  if (isFirstFailure) {
    updateData.payment_failed_at = now;
  }

  await supabase
    .from("billing_subscriptions")
    .update(updateData)
    .eq("stripe_subscription_id", subscriptionId);

  // Send Day 0 email immediately on first failure
  if (isFirstFailure) {
    const user = (existingSubscription.billing_customers as any)?.users;
    if (user?.email) {
      try {
        const { sendPaymentFailureEmail } = await import("@/lib/email/resend");
        await sendPaymentFailureEmail({
          to: user.email,
          userName: user.name || "there",
          daysSinceFailure: 0,
        });
        logBillingEvent("Payment failure Day 0 email sent", {
          userId: user.id,
          subscriptionId,
          invoiceId: invoice.id,
        });
      } catch (emailError) {
        logError("Failed to send payment failure email", emailError, {
          userId: user.id,
          subscriptionId,
          invoiceId: invoice.id,
        });
      }
    }
  }
}
