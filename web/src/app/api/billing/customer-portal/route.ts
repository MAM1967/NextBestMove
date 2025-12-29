import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/billing/stripe";

export async function POST(request: Request) {
  let customer: { stripe_customer_id: string } | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Stripe customer ID
    const { data: customerData } = await supabase
      .from("billing_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    customer = customerData;

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
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\r?\n/g, '');

    if (!baseUrl && requestUrl) {
      // Extract base URL from referer/origin (e.g., "https://nextbestmove.app")
      try {
        const url = new URL(requestUrl.trim().replace(/\r?\n/g, ''));
        baseUrl = `${url.protocol}//${url.host}`;
      } catch {
        // If URL parsing fails, fall back to env or localhost
      }
    }

    // Final fallback to localhost for local development
    baseUrl = (baseUrl || "http://localhost:3000").trim().replace(/\r?\n/g, '');
    const returnUrl = `${baseUrl}/app/settings`;

    // Create billing portal session
    console.log("Creating billing portal session", {
      customerId: customer.stripe_customer_id,
      returnUrl,
      stripeApiKeyPrefix:
        process.env.STRIPE_SECRET_KEY?.substring(0, 7) || "not set",
    });

    // Verify customer exists in Stripe first
    try {
      const stripeCustomer = await stripe.customers.retrieve(
        customer.stripe_customer_id
      );
      console.log("Stripe customer verified", {
        customerId: stripeCustomer.id,
        email: "email" in stripeCustomer ? stripeCustomer.email : "N/A",
        deleted: "deleted" in stripeCustomer ? stripeCustomer.deleted : false,
      });
    } catch (verifyError: unknown) {
      type StripeError = { message?: string; type?: string; code?: string; statusCode?: number };
      const stripeError = verifyError as StripeError;
      const errorMessage = stripeError.message || (verifyError instanceof Error ? verifyError.message : String(verifyError));
      console.error("Failed to verify Stripe customer:", {
        error: errorMessage,
        type: stripeError.type,
        code: stripeError.code,
        statusCode: stripeError.statusCode,
      });
      return NextResponse.json(
        {
          error: "Invalid customer",
          details: errorMessage,
          type: stripeError.type,
          code: stripeError.code,
        },
        { status: 400 }
      );
    }

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
    // Enhanced error logging
    const errorDetails = {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
      rawError: error.raw
        ? {
            message: error.raw.message,
            type: error.raw.type,
            code: error.raw.code,
          }
        : undefined,
      customerId: customer?.stripe_customer_id,
      stripeApiKeyPrefix:
        process.env.STRIPE_SECRET_KEY?.substring(0, 7) || "not set",
    };

    console.error("Error creating customer portal session:", errorDetails);

    // Return more specific error message
    let userMessage = "Failed to create portal session";
    if (
      error.type === "StripeConnectionError" ||
      error.type === "StripeAPIError"
    ) {
      userMessage =
        "Unable to connect to payment provider. Please try again in a moment.";
    } else if (error.code === "resource_missing") {
      userMessage = "Customer account not found. Please contact support.";
    }

    return NextResponse.json(
      {
        error: userMessage,
        details: error.message,
        type: error.type,
        code: error.code,
      },
      { status: 500 }
    );
  }
}
