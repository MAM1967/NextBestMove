import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Debug endpoint to check downgrade warning conditions
 * Returns detailed information about why the warning should/shouldn't show
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's billing customer
    const { data: customer } = await supabase
      .from("billing_customers")
      .select("id, stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!customer) {
      return NextResponse.json({
        shouldShow: false,
        reason: "no_customer",
        debug: { userId: user.id, hasCustomer: false },
      });
    }

    // Get all subscriptions (not just active/trialing)
    const { data: allSubscriptions } = await supabase
      .from("billing_subscriptions")
      .select("id, status, metadata, stripe_subscription_id")
      .eq("billing_customer_id", customer.id)
      .order("created_at", { ascending: false });

    // Get active or trialing subscription
    const { data: subscription } = await supabase
      .from("billing_subscriptions")
      .select("id, metadata, status, stripe_subscription_id")
      .eq("billing_customer_id", customer.id)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    type SubscriptionMetadata = {
      plan_type?: string;
      downgrade_detected_at?: string;
      downgrade_warning_shown?: boolean | string;
      downgrade_pin_count?: number;
      [key: string]: unknown;
    };
    const metadata = subscription ? ((subscription.metadata as SubscriptionMetadata | null) || {}) : {};
    const planType = metadata.plan_type || "standard";

    // Count leads
    const { count: leadCount } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "ACTIVE");

    return NextResponse.json({
      shouldShow: false, // We'll calculate this
      debug: {
        userId: user.id,
        customerId: customer.id,
        hasSubscription: !!subscription,
        subscriptionStatus: subscription?.status,
        subscriptionId: subscription?.id,
        stripeSubscriptionId: subscription?.stripe_subscription_id,
        allSubscriptions: allSubscriptions?.map((s) => ({
          id: s.id,
          status: s.status,
          plan_type: (s.metadata as SubscriptionMetadata | null)?.plan_type,
        })),
        metadata: {
          plan_type: planType,
          downgrade_detected_at: metadata.downgrade_detected_at,
          downgrade_warning_shown: metadata.downgrade_warning_shown,
          downgrade_pin_count: metadata.downgrade_pin_count, // Legacy field name
        },
        leadCount: leadCount || 0,
        pinCount: leadCount || 0, // Legacy field for backward compatibility
        checks: {
          hasSubscription: !!subscription,
          isActiveOrTrialing: subscription?.status === "active" || subscription?.status === "trialing",
          isStandardPlan: planType === "standard",
          downgradeDetected: !!metadata.downgrade_detected_at,
          warningNotShown: !metadata.downgrade_warning_shown,
          leadsExceedLimit: (leadCount || 0) > 10,
          pinsExceedLimit: (leadCount || 0) > 10, // Legacy field for backward compatibility
        },
      },
    });
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

