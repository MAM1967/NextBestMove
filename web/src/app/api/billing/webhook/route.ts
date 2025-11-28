import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/billing/stripe";
import { headers } from "next/headers";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
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
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Store event for auditing
  try {
    await supabase.from("billing_events").insert({
      stripe_event_id: event.id,
      type: event.type,
      payload: event.data.object as any,
      processed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error storing billing event:", error);
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
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null };
        await handleInvoicePaid(supabase, invoice);
        break;
      }

      case "invoice.payment_failed": {
        // event.data.object may have expanded properties not in the base Invoice type
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null };
        await handleInvoicePaymentFailed(supabase, invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
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

  if (!customerId || !subscriptionId) {
    console.error("Missing customer or subscription ID in checkout session");
    return;
  }

  // Get customer from database
  const { data: customer } = await supabase
    .from("billing_customers")
    .select("id, user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (!customer) {
    console.error("Customer not found in database");
    return;
  }

  // Get subscription from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await handleSubscriptionUpdated(supabase, subscription, customer.id);
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
      console.error("Customer not found for subscription update");
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
  else if (subscription.status === "canceled" || subscription.status === "unpaid")
    status = "canceled";
  else if (subscription.status === "active") status = "active";

  // Upsert subscription
  // Use type guards to safely access Stripe.Subscription properties
  const currentPeriodEnd = subscription && 
    'current_period_end' in subscription && 
    typeof subscription.current_period_end === 'number'
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : new Date().toISOString(); // Fallback to now if not available

  const cancelAtPeriodEnd = subscription && 
    'cancel_at_period_end' in subscription
    ? subscription.cancel_at_period_end || false
    : false;

  const trialEndsAt = subscription && 
    'trial_end' in subscription &&
    subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null;

  const { error: upsertError } = await supabase.from("billing_subscriptions").upsert(
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
  );

  if (upsertError) {
    console.error("Error upserting subscription:", upsertError);
    throw new Error(`Failed to save subscription: ${upsertError.message}`);
  }
}

async function handleSubscriptionDeleted(
  supabase: any,
  subscription: Stripe.Subscription
) {
  // Update subscription status to canceled
  await supabase
    .from("billing_subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: false,
    })
    .eq("stripe_subscription_id", subscription.id);
}

async function handleInvoicePaid(
  supabase: any, 
  invoice: Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }
) {
  // Invoice.subscription can be a string ID or a Subscription object
  if (!invoice.subscription) return;
  
  const subscriptionId = typeof invoice.subscription === 'string' 
    ? invoice.subscription 
    : invoice.subscription.id;
  if (!subscriptionId) return;

  // Get subscription from Stripe to update our records
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await handleSubscriptionUpdated(supabase, subscription);
}

async function handleInvoicePaymentFailed(
  supabase: any,
  invoice: Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }
) {
  // Invoice.subscription can be a string ID or a Subscription object
  if (!invoice.subscription) return;
  
  const subscriptionId = typeof invoice.subscription === 'string' 
    ? invoice.subscription 
    : invoice.subscription.id;
  if (!subscriptionId) return;

  // Update subscription status to past_due
  await supabase
    .from("billing_subscriptions")
    .update({
      status: "past_due",
    })
    .eq("stripe_subscription_id", subscriptionId);
}

