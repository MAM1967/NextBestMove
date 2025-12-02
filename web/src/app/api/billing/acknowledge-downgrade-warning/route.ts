import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/billing/acknowledge-downgrade-warning
 * 
 * Mark downgrade warning as shown in subscription metadata
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

    // Get user's billing customer
    const { data: customer } = await supabase
      .from("billing_customers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!customer) {
      return NextResponse.json(
        { error: "No billing customer found" },
        { status: 404 }
      );
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
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Update metadata to mark warning as shown
    const metadata = (subscription.metadata as any) || {};
    await supabase
      .from("billing_subscriptions")
      .update({
        metadata: {
          ...metadata,
          downgrade_warning_shown: true,
        },
      })
      .eq("id", subscription.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error acknowledging downgrade warning:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

