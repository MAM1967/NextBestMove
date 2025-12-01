import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/billing/stripe";

export async function POST(request: Request) {
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
    // Try to get base URL from request headers first (for production), then env var, then fallback
    const requestUrl =
      request.headers.get("referer") || request.headers.get("origin");
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!baseUrl && requestUrl) {
      // Extract base URL from referer/origin (e.g., "https://nextbestmove.app")
      try {
        const url = new URL(requestUrl);
        baseUrl = `${url.protocol}//${url.host}`;
      } catch {
        // If URL parsing fails, fall back to env or localhost
      }
    }

    // Final fallback to localhost for local development
    baseUrl = baseUrl || "http://localhost:3000";
    const returnUrl = `${baseUrl}/app/settings`;

    // Create billing portal session
    console.log("Creating billing portal session", {
      customerId: customer.stripe_customer_id,
      returnUrl,
    });

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: returnUrl,
    });

    console.log("Billing portal session created", {
      sessionId: session.id,
      url: session.url,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating customer portal session:", {
      error: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
      customerId: customer?.stripe_customer_id,
    });
    return NextResponse.json(
      {
        error: "Failed to create portal session",
        details: error.message,
        type: error.type,
        code: error.code,
      },
      { status: 500 }
    );
  }
}
