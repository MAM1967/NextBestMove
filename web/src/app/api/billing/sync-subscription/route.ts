import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/billing/stripe";
import { handleSubscriptionUpdated } from "../webhook/route";
import Stripe from "stripe";

/**
 * Manual sync endpoint to fetch subscription from Stripe and update database
 * Useful when webhook didn't fire or to recover from sync issues
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get billing customer
    const { data: customer } = await supabase
      .from("billing_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!customer?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe customer found. Please complete checkout first." },
        { status: 404 }
      );
    }

    console.log("Syncing subscription for customer:", customer.stripe_customer_id);
    
    // Get all subscriptions from Stripe for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.stripe_customer_id,
      limit: 10,
      status: "all",
    });

    console.log("Found subscriptions:", subscriptions.data.length);
    console.log("Subscription statuses:", subscriptions.data.map(s => ({ id: s.id, status: s.status })));

    if (subscriptions.data.length === 0) {
      console.error("No subscriptions found in Stripe");
      return NextResponse.json(
        { error: "No subscriptions found in Stripe for this customer" },
        { status: 404 }
      );
    }

    // Get the most recent active/trialing subscription, or most recent if none active
    const activeSub = subscriptions.data.find(
      (s) => s.status === "active" || s.status === "trialing"
    );
    // Ensure we have a subscription and type it correctly
    if (!subscriptions.data[0]) {
      return NextResponse.json(
        { error: "No valid subscription found" },
        { status: 404 }
      );
    }
    const selectedSub = activeSub || subscriptions.data[0];
    const subscription = selectedSub as Stripe.Subscription;

    // Get billing customer ID
    const { data: billingCustomer } = await supabase
      .from("billing_customers")
      .select("id")
      .eq("stripe_customer_id", customer.stripe_customer_id)
      .single();

    if (!billingCustomer) {
      return NextResponse.json(
        { error: "Billing customer record not found" },
        { status: 500 }
      );
    }

    console.log("Syncing subscription:", subscription.id, "Status:", subscription.status);
    
    // Use admin client for subscription update to bypass RLS
    const adminSupabase = createAdminClient();
    await handleSubscriptionUpdated(adminSupabase, subscription, billingCustomer.id);

    // Verify it was saved
    const { data: savedSubscription } = await supabase
      .from("billing_subscriptions")
      .select("*")
      .eq("stripe_subscription_id", subscription.id)
      .single();

    console.log("Saved subscription:", savedSubscription);

    // Extract current_period_end with proper typing
    // Use type guard to safely access Stripe.Subscription properties
    const currentPeriodEnd = subscription && 
      'current_period_end' in subscription && 
      typeof subscription.current_period_end === 'number'
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: currentPeriodEnd,
      },
      saved: savedSubscription ? true : false,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error syncing subscription:", errorMessage);
    return NextResponse.json(
      { error: "Failed to sync subscription", details: errorMessage },
      { status: 500 }
    );
  }
}

