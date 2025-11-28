import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/billing/stripe";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Stripe customer ID
    const { data: customer } = await supabase
      .from("billing_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!customer?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing customer found" },
        { status: 404 }
      );
    }

    // Build return URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const returnUrl = `${baseUrl}/app/settings`;

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating customer portal session:", error);
    return NextResponse.json(
      { error: "Failed to create portal session", details: error.message },
      { status: 500 }
    );
  }
}

