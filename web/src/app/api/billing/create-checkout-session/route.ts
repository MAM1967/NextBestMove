import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { stripe, getPriceId, getPlanMetadata } from "@/lib/billing/stripe";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables first
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY is not set");
      return NextResponse.json(
        { error: "Stripe configuration error", details: "STRIPE_SECRET_KEY is not set" },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { plan, interval, isTrial = false } = body;

    // Validate plan and interval
    if (!plan || !["standard", "professional"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'standard' or 'professional'" },
        { status: 400 }
      );
    }

    if (!interval || !["month", "year"].includes(interval)) {
      return NextResponse.json(
        { error: "Invalid interval. Must be 'month' or 'year'" },
        { status: 400 }
      );
    }

    const priceId = getPriceId(plan, interval);
    if (!priceId) {
      console.error(`Price ID not found for ${plan}/${interval}`);
      console.error("Environment check:", {
        STANDARD_MONTHLY: process.env.STRIPE_PRICE_ID_STANDARD_MONTHLY ? "set" : "missing",
        STANDARD_YEARLY: process.env.STRIPE_PRICE_ID_STANDARD_YEARLY ? "set" : "missing",
        PROFESSIONAL_MONTHLY: process.env.STRIPE_PRICE_ID_PROFESSIONAL_MONTHLY ? "set" : "missing",
        PROFESSIONAL_YEARLY: process.env.STRIPE_PRICE_ID_PROFESSIONAL_YEARLY ? "set" : "missing",
      });
      return NextResponse.json(
        { 
          error: "Price ID not configured for this plan",
          details: `Price ID missing for ${plan}/${interval}. Check environment variables.`
        },
        { status: 500 }
      );
    }

    console.log("Getting plan metadata for:", { plan, interval });
    const planMetadata = getPlanMetadata(plan, interval);
    console.log("Plan metadata result:", planMetadata);
    if (!planMetadata) {
      console.error("Plan metadata lookup failed", { plan, interval });
      return NextResponse.json(
        { error: "Plan metadata not found", details: `Plan: ${plan}, Interval: ${interval}` },
        { status: 500 }
      );
    }

    // Get or create Stripe customer
    let customerId: string;

    const { data: existingCustomer } = await supabase
      .from("billing_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingCustomer?.stripe_customer_id) {
      // Verify customer exists in Stripe (in case it was deleted or is a test ID)
      try {
        await stripe.customers.retrieve(existingCustomer.stripe_customer_id);
        customerId = existingCustomer.stripe_customer_id;
        console.log("Using existing Stripe customer:", customerId);
      } catch (error: any) {
        // Customer doesn't exist in Stripe, create a new one
        console.warn("Existing customer ID not found in Stripe, creating new customer:", {
          customerId: existingCustomer.stripe_customer_id,
          error: error.message,
        });
        
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            user_id: user.id,
          },
        });
        customerId = customer.id;

        // Update database with new customer ID
        const { error: updateError } = await supabase
          .from("billing_customers")
          .update({ stripe_customer_id: customerId })
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Error updating billing customer:", updateError);
          return NextResponse.json(
            { 
              error: "Failed to update customer record", 
              details: updateError.message 
            },
            { status: 500 }
          );
        }
        console.log("Created new Stripe customer and updated database:", customerId);
      }
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;

      // Store in database
      const { error: insertError } = await supabase.from("billing_customers").insert({
        user_id: user.id,
        stripe_customer_id: customerId,
        currency: "usd",
      });

      if (insertError) {
        console.error("Error inserting billing customer:", insertError);
        return NextResponse.json(
          { 
            error: "Failed to save customer record", 
            details: insertError.message 
          },
          { status: 500 }
        );
      }
      console.log("Created new Stripe customer:", customerId);
    }

    // Build success and cancel URLs
    // Priority: 1) request.nextUrl.origin (most reliable), 2) NEXT_PUBLIC_APP_URL, 3) localhost fallback
    let baseUrl: string;
    
    // Try to get origin from request URL (most reliable)
    try {
      const url = new URL(request.url);
      baseUrl = `${url.protocol}//${url.host}`;
      console.log("Using request URL origin:", baseUrl);
    } catch {
      // If request.url is not available, try env var
      baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "";
      
      // Validate and clean baseUrl if it exists
      if (baseUrl) {
        // Remove trailing slash if present
        baseUrl = baseUrl.replace(/\/$/, "");
        // Validate it's a proper URL
        try {
          new URL(baseUrl);
          console.log("Using NEXT_PUBLIC_APP_URL:", baseUrl);
        } catch {
          // Invalid URL, clear it
          console.warn("NEXT_PUBLIC_APP_URL is invalid, falling back to localhost");
          baseUrl = "";
        }
      }
      
      // Final fallback to localhost for local development
      if (!baseUrl) {
        baseUrl = "http://localhost:3000";
        console.log("Using localhost fallback:", baseUrl);
      }
    }
    
    // Ensure baseUrl is valid before constructing URLs
    try {
      new URL(baseUrl);
    } catch (error) {
      console.error("Invalid baseUrl:", baseUrl, error);
      return NextResponse.json(
        { 
          error: "Invalid app URL configuration", 
          details: `Failed to determine valid base URL. NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || "not set"}` 
        },
        { status: 500 }
      );
    }
    
    const successUrl = `${baseUrl}/app/settings?checkout=success`;
    const cancelUrl = `${baseUrl}/app/settings?checkout=canceled`;
    
    // Validate URLs before sending to Stripe
    try {
      new URL(successUrl);
      new URL(cancelUrl);
    } catch (error) {
      console.error("Invalid checkout URLs:", { successUrl, cancelUrl, baseUrl, error });
      return NextResponse.json(
        { 
          error: "Invalid checkout URL configuration", 
          details: `Failed to construct valid URLs. Base URL: ${baseUrl}` 
        },
        { status: 500 }
      );
    }
    
    console.log("Checkout URLs:", { successUrl, cancelUrl, baseUrl });

    // Create checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id,
        plan_name: planMetadata.name,
        plan_type: plan,
        interval: interval,
      },
    };

    // Add trial period if requested (14 days, no payment method required)
    if (isTrial) {
      sessionParams.subscription_data = {
        trial_period_days: 14,
        metadata: {
          user_id: user.id,
          plan_name: planMetadata.name,
          plan_type: plan,
          interval: interval,
        },
      };
      // Only collect payment method if required (for trials, this means it won't be required)
      sessionParams.payment_method_collection = "if_required";
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session", details: error.message },
      { status: 500 }
    );
  }
}

