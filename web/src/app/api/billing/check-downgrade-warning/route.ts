import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { checkPinLimit } from "@/lib/billing/subscription";

/**
 * GET /api/billing/check-downgrade-warning
 * 
 * Check if user should see downgrade warning modal
 * Returns: { shouldShow: boolean, currentLeadCount?: number, currentPinCount?: number (legacy), limit?: number }
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
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!customer) {
      return NextResponse.json({ 
        shouldShow: false, 
        reason: "no_customer",
        debug: { userId: user.id }
      });
    }

    // Get active or trialing subscription
    const { data: subscription } = await supabase
      .from("billing_subscriptions")
      .select("id, metadata, status")
      .eq("billing_customer_id", customer.id)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!subscription) {
      console.log("❌ No subscription found for customer:", customer.id);
      // Check if there are any subscriptions at all
      const { data: allSubs } = await supabase
        .from("billing_subscriptions")
        .select("id, status, metadata")
        .eq("billing_customer_id", customer.id);
      
      return NextResponse.json({ 
        shouldShow: false, 
        reason: "no_subscription",
        debug: {
          customerId: customer.id,
          allSubscriptions: allSubs?.map(s => ({
            id: s.id,
            status: s.status,
            plan_type: (s.metadata as { plan_type?: string } | null)?.plan_type
          }))
        }
      });
    }

    console.log("📊 Subscription found:", {
      id: subscription.id,
      status: subscription.status,
      metadata: subscription.metadata,
    });

    type SubscriptionMetadata = {
      plan_type?: string;
      downgrade_detected_at?: string;
      downgrade_warning_shown?: boolean | string;
      downgrade_pin_count?: number;
      [key: string]: unknown;
    };
    const metadata = (subscription.metadata as SubscriptionMetadata | null) || {};
    const planType = metadata.plan_type || "standard";

    console.log("🔍 Checking conditions:", {
      planType,
      downgrade_detected_at: metadata.downgrade_detected_at,
      downgrade_warning_shown: metadata.downgrade_warning_shown,
      downgrade_pin_count: metadata.downgrade_pin_count,
    });

    // Only show warning for Standard plan users
    if (planType !== "standard") {
      console.log("❌ Plan type is not standard:", planType);
      return NextResponse.json({ shouldShow: false, reason: "not_standard_plan", planType });
    }

    // Check if warning was already shown
    if (metadata.downgrade_warning_shown === true || metadata.downgrade_warning_shown === "true") {
      console.log("❌ Warning already shown");
      return NextResponse.json({ shouldShow: false, reason: "warning_already_shown" });
    }

    // Check if downgrade was detected
    if (!metadata.downgrade_detected_at) {
      console.log("❌ No downgrade detected");
      return NextResponse.json({ shouldShow: false, reason: "no_downgrade_detected" });
    }

    // Check pin limit
    const limitInfo = await checkPinLimit(user.id);
    console.log("📌 Pin limit check:", {
      currentCount: limitInfo.currentCount,
      limit: limitInfo.limit,
      exceedsLimit: limitInfo.currentCount > limitInfo.limit,
    });

    if (limitInfo.currentCount <= limitInfo.limit) {
      // User is within limit, mark warning as shown
      console.log("✅ User within limit, marking warning as shown");
      await supabase
        .from("billing_subscriptions")
        .update({
          metadata: {
            ...metadata,
            downgrade_warning_shown: true,
          },
        })
        .eq("id", subscription.id);
      return NextResponse.json({ 
        shouldShow: false, 
        reason: "within_limit",
        currentCount: limitInfo.currentCount,
        limit: limitInfo.limit,
      });
    }

    console.log("✅ All conditions met, showing warning");
    return NextResponse.json({
      shouldShow: true,
      currentLeadCount: limitInfo.currentCount,
      currentPinCount: limitInfo.currentCount, // Legacy field for backward compatibility
      limit: limitInfo.limit,
    });
  } catch (error) {
    console.error("Error checking downgrade warning:", error);
    return NextResponse.json({ shouldShow: false });
  }
}

