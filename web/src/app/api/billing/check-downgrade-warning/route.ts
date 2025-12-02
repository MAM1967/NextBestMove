import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { checkPinLimit } from "@/lib/billing/subscription";

/**
 * GET /api/billing/check-downgrade-warning
 * 
 * Check if user should see downgrade warning modal
 * Returns: { shouldShow: boolean, currentPinCount?: number, limit?: number }
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
      return NextResponse.json({ shouldShow: false });
    }

    // Get active subscription
    const { data: subscription } = await supabase
      .from("billing_subscriptions")
      .select("id, metadata")
      .eq("billing_customer_id", customer.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!subscription) {
      return NextResponse.json({ shouldShow: false });
    }

    const metadata = (subscription.metadata as any) || {};
    const planType = metadata.plan_type || "standard";

    // Only show warning for Standard plan users
    if (planType !== "standard") {
      return NextResponse.json({ shouldShow: false });
    }

    // Check if warning was already shown
    if (metadata.downgrade_warning_shown) {
      return NextResponse.json({ shouldShow: false });
    }

    // Check if downgrade was detected
    if (!metadata.downgrade_detected_at) {
      return NextResponse.json({ shouldShow: false });
    }

    // Check pin limit
    const limitInfo = await checkPinLimit(user.id);
    if (limitInfo.currentCount <= limitInfo.limit) {
      // User is within limit, mark warning as shown
      await supabase
        .from("billing_subscriptions")
        .update({
          metadata: {
            ...metadata,
            downgrade_warning_shown: true,
          },
        })
        .eq("id", subscription.id);
      return NextResponse.json({ shouldShow: false });
    }

    return NextResponse.json({
      shouldShow: true,
      currentPinCount: limitInfo.currentCount,
      limit: limitInfo.limit,
    });
  } catch (error) {
    console.error("Error checking downgrade warning:", error);
    return NextResponse.json({ shouldShow: false });
  }
}

