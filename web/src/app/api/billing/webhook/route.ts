import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/billing/stripe";
import { headers } from "next/headers";
import Stripe from "stripe";
import { logWebhookEvent, logError, logBillingEvent, logWarn } from "@/lib/utils/logger";
import { getPlanFromPriceId } from "@/lib/billing/plan-detection";
import { updateUserTier, shouldDowngradeToFree } from "@/lib/billing/tier";

// Configure route for webhook handling
export const runtime = "nodejs"; // Use Node.js runtime for better compatibility
export const maxDuration = 30; // Allow up to 30 seconds for webhook processing (Vercel Pro plan)

// Disable body parsing to get raw body for Stripe signature verification
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Track webhook processing time for monitoring
  const startTime = Date.now();
  let eventId: string | undefined;
  let eventType: string | undefined;

  // Wrap everything in try-catch to ensure we always return a response
  try {
    // Get raw body as text (required for Stripe signature verification)
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      logWebhookEvent("Missing stripe-signature header", {
        status: "error",
        webhookType: "stripe",
      });
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      logError("STRIPE_WEBHOOK_SECRET is not set", undefined, {
        context: "webhook_config",
      });
      // Return 500 so Stripe knows to retry (this is a server configuration issue)
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Trim whitespace from webhook secret (common issue with env vars)
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET.trim();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
      eventId = event.id;
      eventType = event.type;
    } catch (err: any) {
      logWebhookEvent("Webhook signature verification failed", {
        status: "error",
        webhookType: "stripe",
        error: err.message,
        processingTimeMs: Date.now() - startTime,
      });
      // Return 400 for signature verification failures (don't retry)
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Use admin client for webhook - no user auth context, need to bypass RLS
    let supabase;
    try {
      supabase = createAdminClient();
    } catch (adminError: any) {
      logError("Failed to create admin client", adminError, {
        context: "webhook_admin_client",
        eventId: event.id,
      });
      // Return 500 so Stripe retries (this is a server configuration issue)
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Check if event has already been processed (idempotency check)
    const { data: existingEvent } = await supabase
      .from("billing_events")
      .select("stripe_event_id, processed_at")
      .eq("stripe_event_id", event.id)
      .maybeSingle();

    if (existingEvent) {
      // Event already processed - return success without processing again
      // Log as warning to make duplicates visible in monitoring
      logWarn("Duplicate webhook event detected and skipped (idempotency)", {
        eventId: event.id,
        webhookType: "stripe",
        eventType: event.type,
        status: "duplicate",
        originallyProcessedAt: existingEvent.processed_at,
        message: "This event was already processed. Safe to ignore.",
      });
      logWebhookEvent("Webhook event already processed (idempotency)", {
        eventId: event.id,
        webhookType: "stripe",
        eventType: event.type,
        status: "duplicate",
        originallyProcessedAt: existingEvent.processed_at,
      });
      return NextResponse.json(
        { received: true, duplicate: true },
        { status: 200 }
      );
    }

    // Store event for auditing (with processed_at set to now)
    try {
      const processedAt = new Date().toISOString();
      const { error: insertError } = await supabase.from("billing_events").insert({
        stripe_event_id: event.id,
        type: event.type,
        payload: event.data.object as any,
        processed_at: processedAt,
      });
      
      if (insertError) {
        // Check if it's a duplicate (race condition - another request processed it)
        if (insertError.code === "23505") {
          logWarn("Duplicate webhook event detected (race condition)", {
            eventId: event.id,
            webhookType: "stripe",
            eventType: event.type,
            status: "duplicate",
            message: "Event was processed by another concurrent request. Safe to ignore.",
          });
          logWebhookEvent("Billing event already exists (race condition)", {
            eventId: event.id,
            webhookType: "stripe",
            eventType: event.type,
            status: "duplicate",
          });
          // Return success - event was already processed by another request
          return NextResponse.json(
            { received: true, duplicate: true },
            { status: 200 }
          );
        } else {
          logError("Error storing billing event", insertError, {
            eventId: event.id,
            eventType: event.type,
            errorCode: insertError.code,
          });
          // Continue processing even if event storage fails
        }
      } else {
        logWebhookEvent("Billing event stored", {
          eventId: event.id,
          webhookType: "stripe",
          eventType: event.type,
          status: "success",
        });
      }
    } catch (error) {
      logError("Error storing billing event (exception)", error, {
        eventId: event.id,
        eventType: event.type,
      });
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
          const invoice = event.data.object as Stripe.Invoice & {
            subscription?: string | Stripe.Subscription | null;
          };
          await handleInvoicePaid(supabase, invoice);
          break;
        }

        case "invoice.payment_failed": {
          // event.data.object may have expanded properties not in the base Invoice type
          const invoice = event.data.object as Stripe.Invoice & {
            subscription?: string | Stripe.Subscription | null;
          };
          await handleInvoicePaymentFailed(supabase, invoice);
          break;
        }

        default:
          logWebhookEvent("Unhandled event type", {
            eventId: event.id,
            webhookType: "stripe",
            eventType: event.type,
            status: "warning",
          });
      }

      // Mark event as processed (in case it wasn't marked earlier)
      await supabase
        .from("billing_events")
        .update({ processed_at: new Date().toISOString() })
        .eq("stripe_event_id", event.id)
        .is("processed_at", null); // Only update if not already processed

      const processingTime = Date.now() - startTime;
      
      logWebhookEvent("Webhook processed successfully", {
        eventId: event.id,
        webhookType: "stripe",
        eventType: event.type,
        status: "success",
        processingTimeMs: processingTime,
      });

      // Log slow processing (> 5 seconds) as warning
      if (processingTime > 5000) {
        logWarn("Webhook processing took longer than expected", {
          eventId: event.id,
          eventType: event.type,
          processingTimeMs: processingTime,
        });
      }

      // Always return 200 for successful processing
      return NextResponse.json({ received: true }, { status: 200 });
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      
      logError("Error processing webhook", error, {
        eventId: event.id,
        eventType: event.type,
        errorMessage: error?.message,
        errorStack: error?.stack,
        processingTimeMs: processingTime,
      });
      // Return 500 so Stripe retries the webhook
      return NextResponse.json(
        { error: "Webhook processing failed", details: error?.message },
        { status: 500 }
      );
    }
  } catch (outerError: any) {
    // Catch any errors in the outer try-catch (e.g., reading request body, headers)
    const processingTime = Date.now() - startTime;
    
    logError("Fatal error in webhook handler", outerError, {
      errorMessage: outerError?.message,
      errorStack: outerError?.stack,
      eventId,
      eventType,
      processingTimeMs: processingTime,
    });
    // Return 500 so Stripe retries
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(
  supabase: any,
  session: Stripe.Checkout.Session
) {
  try {
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    logBillingEvent("checkout.session.completed", {
      customerId,
      subscriptionId,
      eventId: session.id,
    });

    if (!customerId || !subscriptionId) {
      logError(
        "Missing customer or subscription ID in checkout session",
        undefined,
        {
          sessionId: session.id,
        }
      );
      // Don't throw - this is a data issue, not a processing failure
      return;
    }

    // Get customer from database
    const { data: customer, error: customerError } = await supabase
      .from("billing_customers")
      .select("id, user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (customerError) {
      logError("Error fetching customer", customerError, {
        customerId,
        sessionId: session.id,
      });
      // Throw for database errors so webhook can retry
      throw new Error(`Database error fetching customer: ${customerError.message}`);
    }

    if (!customer) {
      logError("Customer not found in database", undefined, {
        customerId,
        sessionId: session.id,
      });
      // Don't throw - customer might not exist yet, this is expected in some flows
      return;
    }

    logBillingEvent("Customer found in database", {
      customerId,
      userId: customer.user_id,
      sessionId: session.id,
    });

    // Get subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    logBillingEvent("Subscription retrieved from Stripe", {
      subscriptionId: subscription.id,
      status: subscription.status,
      customerId,
    });

    await handleSubscriptionUpdated(supabase, subscription, customer.id);
    logBillingEvent("Subscription updated in database", {
      subscriptionId: subscription.id,
      customerId,
    });
  } catch (error: any) {
    logError("Error in handleCheckoutCompleted", error, {
      sessionId: session.id,
    });
    // Re-throw so main handler can catch and return 500 for retry
    throw error;
  }
}

export async function handleSubscriptionUpdated(
  supabase: any,
  subscription: Stripe.Subscription,
  billingCustomerId?: string
) {
  try {
    // Check if subscription was recently updated (within last minute) - idempotency guard
    if (billingCustomerId) {
      const { data: recentUpdate } = await supabase
        .from("billing_subscriptions")
        .select("updated_at")
        .eq("stripe_subscription_id", subscription.id)
        .gte("updated_at", new Date(Date.now() - 60 * 1000).toISOString())
        .maybeSingle();

      if (recentUpdate) {
        // Recently updated - skip to avoid race conditions (idempotency)
        logBillingEvent("Subscription recently updated, skipping (idempotency)", {
          subscriptionId: subscription.id,
          updatedAt: recentUpdate.updated_at,
        });
        return;
      }
    }

    // Get customer ID if not provided
    if (!billingCustomerId) {
      const { data: customer, error: customerError } = await supabase
        .from("billing_customers")
        .select("id")
        .eq("stripe_customer_id", subscription.customer as string)
        .maybeSingle();

      if (customerError) {
        logError("Error fetching customer for subscription update", customerError, {
          subscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
        });
        throw new Error(`Database error fetching customer: ${customerError.message}`);
      }

      if (!customer) {
        logError("Customer not found for subscription update", undefined, {
          subscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
        });
        // Don't throw - customer might not exist yet
        return;
      }
      billingCustomerId = customer.id;
    }

  // Extract plan metadata from subscription
  const priceId = subscription.items.data[0]?.price.id;
  const planMetadata = subscription.metadata || {};

  // Determine plan_type from price_id (more reliable than Stripe metadata)
  const planInfo = getPlanFromPriceId(priceId);
  
  // Use plan info from price_id, but allow Stripe metadata to override if explicitly set
  const finalPlanType = planMetadata.plan_type || planInfo.plan_type;
  const finalPlanName = planMetadata.plan_name || planInfo.plan_name;
  const finalInterval = planMetadata.interval || planInfo.interval;

  // Map Stripe status to our status enum
  let status: "trialing" | "active" | "past_due" | "canceled" = "active";
  if (subscription.status === "trialing") status = "trialing";
  else if (subscription.status === "past_due") status = "past_due";
  else if (
    subscription.status === "canceled" ||
    subscription.status === "unpaid"
  )
    status = "canceled";
  else if (subscription.status === "active") status = "active";

  // Upsert subscription
  // Use type guards to safely access Stripe.Subscription properties
  const currentPeriodEnd =
    subscription &&
    "current_period_end" in subscription &&
    typeof subscription.current_period_end === "number"
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : new Date().toISOString(); // Fallback to now if not available

  const cancelAtPeriodEnd =
    subscription && "cancel_at_period_end" in subscription
      ? subscription.cancel_at_period_end || false
      : false;

  const trialEndsAt =
    subscription && "trial_end" in subscription && subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null;

  logBillingEvent("Upserting subscription to database", {
    subscriptionId: subscription.id,
    status,
    priceId,
    planType: finalPlanType,
    billingCustomerId,
  });

  // Get old subscription BEFORE upsert to detect downgrades
  const { data: oldSubscriptionData } = await supabase
    .from("billing_subscriptions")
    .select("metadata")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  const oldPlanType = (oldSubscriptionData?.metadata as any)?.plan_type;
  const newPlanType = finalPlanType;

  // Cancel any other active/trialing subscriptions for this customer
  // This ensures only one active subscription per customer
  if (status === "active" || status === "trialing") {
    await supabase
      .from("billing_subscriptions")
      .update({
        status: "canceled",
        cancel_at_period_end: false,
      })
      .eq("billing_customer_id", billingCustomerId)
      .in("status", ["active", "trialing"])
      .neq("stripe_subscription_id", subscription.id);
  }

  const { data: upsertedData, error: upsertError } = await supabase
    .from("billing_subscriptions")
    .upsert(
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
          plan_name: finalPlanName,
          plan_type: finalPlanType,
          interval: finalInterval,
          amount: subscription.items.data[0]?.price.unit_amount || 0,
        },
      },
      {
        onConflict: "stripe_subscription_id",
      }
    )
    .select();

    if (upsertError) {
      logError("Error upserting subscription", upsertError, {
        subscriptionId: subscription.id,
        billingCustomerId,
      });
      throw new Error(`Failed to save subscription: ${upsertError.message}`);
    }

    logBillingEvent("Subscription successfully saved to database", {
      subscriptionId: subscription.id,
      databaseId: upsertedData?.[0]?.id,
      billingCustomerId,
    });

    // Update user tier based on subscription status
    try {
      const { data: customer } = await supabase
        .from("billing_customers")
        .select("user_id")
        .eq("id", billingCustomerId)
        .single();
      
      if (customer?.user_id) {
        // Check if trial ended and should downgrade to Free
        if (status === "trialing" && trialEndsAt) {
          const trialEnd = new Date(trialEndsAt);
          const now = new Date();
          
          if (now >= trialEnd) {
            // Trial ended - check if should downgrade
            const shouldDowngrade = await shouldDowngradeToFree(supabase, customer.user_id);
            if (shouldDowngrade) {
              // Update tier to Free
              await supabase
                .from("users")
                .update({ tier: "free" })
                .eq("id", customer.user_id);
              
              logBillingEvent("User downgraded to Free tier (trial ended)", {
                userId: customer.user_id,
                subscriptionId: subscription.id,
              });
            }
          }
        }
        
        // Update tier based on current subscription status
        await updateUserTier(supabase, customer.user_id);
      }
    } catch (tierError: any) {
      // Log but don't fail webhook - tier update is not critical
      logError("Error updating user tier in webhook", tierError, {
        subscriptionId: subscription.id,
        billingCustomerId,
      });
    }

    // Detect plan downgrade (Premium → Standard)
    if (upsertedData && upsertedData.length > 0) {

      // Check if downgrading from Premium to Standard
      if (
        (oldPlanType === "premium" || oldPlanType === "professional") &&
        newPlanType === "standard" &&
        status === "active"
      ) {
        // Get user ID to check pin count
        const { data: customer, error: customerError } = await supabase
          .from("billing_customers")
          .select("user_id")
          .eq("id", billingCustomerId)
          .single();

        if (customerError) {
          logError("Error fetching customer for downgrade check", customerError, {
            subscriptionId: subscription.id,
            billingCustomerId,
          });
          // Don't throw - downgrade check is non-critical
        } else if (customer) {
          // Check pin count
          const { count, error: countError } = await supabase
            .from("leads")
            .select("*", { count: "exact", head: true })
            .eq("user_id", customer.user_id)
            .eq("status", "ACTIVE");

          if (countError) {
            logError("Error counting leads for downgrade check", countError, {
              subscriptionId: subscription.id,
              userId: customer.user_id,
            });
            // Don't throw - downgrade check is non-critical
          } else {
            const leadCount = count || 0;
            if (leadCount > 10) {
              // Store downgrade warning flag in metadata
              // Merge with existing metadata to preserve other fields
              const existingMetadata = upsertedData[0].metadata as any || {};
              const { error: updateError } = await supabase
                .from("billing_subscriptions")
                .update({
                  metadata: {
                    ...existingMetadata,
                    ...planMetadata,
                    downgrade_warning_shown: false, // Frontend will check and show modal
                    downgrade_pin_count: leadCount, // Legacy field name
                    downgrade_lead_count: leadCount,
                    downgrade_detected_at: new Date().toISOString(),
                  },
                })
                .eq("id", upsertedData[0].id);

              if (updateError) {
                logError("Error updating subscription metadata for downgrade", updateError, {
                  subscriptionId: subscription.id,
                  userId: customer.user_id,
                });
                // Don't throw - metadata update is non-critical
              } else {
                logBillingEvent("Plan downgrade detected with lead limit exceeded", {
                  subscriptionId: subscription.id,
                  userId: customer.user_id,
                  leadCount,
                  pinCount: leadCount, // Legacy field for backward compatibility
                  oldPlan: oldPlanType,
                  newPlan: newPlanType,
                });
              }
            }
          }
        }
      }
    }
  } catch (error: any) {
    logError("Error in handleSubscriptionUpdated", error, {
      subscriptionId: subscription.id,
      billingCustomerId,
    });
    // Re-throw so main handler can catch and return 500 for retry
    throw error;
  }
}

async function handleSubscriptionDeleted(
  supabase: any,
  subscription: Stripe.Subscription
) {
  try {
    // Get existing subscription to preserve metadata
    const { data: existingSubscription, error: fetchError } = await supabase
      .from("billing_subscriptions")
      .select("metadata")
      .eq("stripe_subscription_id", subscription.id)
      .maybeSingle();

    if (fetchError) {
      logError("Error fetching subscription for deletion", fetchError, {
        subscriptionId: subscription.id,
      });
      // Continue - we'll still try to update
    }

    const existingMetadata = (existingSubscription?.metadata as any) || {};

    // Update subscription status to canceled and store canceled_at timestamp
    // This enables 30-day reactivation window
    const { error: updateError } = await supabase
      .from("billing_subscriptions")
      .update({
        status: "canceled",
        cancel_at_period_end: false,
        metadata: {
          ...existingMetadata,
          canceled_at: new Date().toISOString(),
        },
      })
      .eq("stripe_subscription_id", subscription.id);

    if (updateError) {
      logError("Error updating subscription status to canceled", updateError, {
        subscriptionId: subscription.id,
      });
      throw new Error(`Failed to update subscription: ${updateError.message}`);
    }
  } catch (error: any) {
    logError("Error in handleSubscriptionDeleted", error, {
      subscriptionId: subscription.id,
    });
    // Re-throw so main handler can catch and return 500 for retry
    throw error;
  }
}

async function handleInvoicePaid(
  supabase: any,
  invoice: Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  }
) {
  try {
    // Invoice.subscription can be a string ID or a Subscription object
    if (!invoice.subscription) return;

    const subscriptionId =
      typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription.id;
    if (!subscriptionId) return;

    // Get subscription from Stripe to update our records
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await handleSubscriptionUpdated(supabase, subscription);
  } catch (error: any) {
    logError("Error in handleInvoicePaid", error, {
      invoiceId: invoice.id,
    });
    // Re-throw so main handler can catch and return 500 for retry
    throw error;
  }
}

async function handleInvoicePaymentFailed(
  supabase: any,
  invoice: Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  }
) {
  try {
    // Invoice.subscription can be a string ID or a Subscription object
    if (!invoice.subscription) return;

    const subscriptionId =
      typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription.id;
    if (!subscriptionId) return;

    // Get subscription to check if payment_failed_at is already set
    const { data: existingSubscription, error: fetchError } = await supabase
      .from("billing_subscriptions")
      .select(
        "id, payment_failed_at, billing_customer_id, billing_customers!inner(user_id, users!inner(email, name))"
      )
      .eq("stripe_subscription_id", subscriptionId)
      .maybeSingle();

    if (fetchError) {
      logError("Error fetching subscription for payment failure", fetchError, {
        subscriptionId,
        invoiceId: invoice.id,
      });
      throw new Error(`Database error fetching subscription: ${fetchError.message}`);
    }

    if (!existingSubscription) {
      logError("Subscription not found for payment failure", undefined, {
        subscriptionId,
        invoiceId: invoice.id,
      });
      // Don't throw - subscription might not exist yet
      return;
    }

    const now = new Date().toISOString();
    const isFirstFailure = !existingSubscription.payment_failed_at;

    // Update subscription status to past_due and set payment_failed_at if first failure
    const updateData: any = {
      status: "past_due",
    };

    if (isFirstFailure) {
      updateData.payment_failed_at = now;
    }

    const { error: updateError } = await supabase
      .from("billing_subscriptions")
      .update(updateData)
      .eq("stripe_subscription_id", subscriptionId);

    if (updateError) {
      logError("Error updating subscription status for payment failure", updateError, {
        subscriptionId,
        invoiceId: invoice.id,
      });
      throw new Error(`Failed to update subscription: ${updateError.message}`);
    }

    // On first payment failure, immediately downgrade user to Free tier
    if (isFirstFailure) {
      const user = (existingSubscription.billing_customers as any)?.users;
      if (user?.id) {
        try {
          const { updateUserTier } = await import("@/lib/billing/tier");
          await updateUserTier(supabase, user.id);
          logBillingEvent("User downgraded to Free tier (payment failure)", {
            userId: user.id,
            subscriptionId,
            invoiceId: invoice.id,
          });
        } catch (tierError) {
          logError("Failed to downgrade user to Free tier on payment failure", tierError, {
            userId: user.id,
            subscriptionId,
            invoiceId: invoice.id,
          });
          // Don't throw - tier update failure shouldn't fail the webhook
        }
      }
    }

    // Send Day 0 email immediately on first failure
    if (isFirstFailure) {
      const user = (existingSubscription.billing_customers as any)?.users;
      if (user?.email) {
        try {
          const { sendPaymentFailureEmail } = await import("@/lib/email/resend");
          await sendPaymentFailureEmail({
            to: user.email,
            userName: user.name || "there",
            daysSinceFailure: 0,
          });
          logBillingEvent("Payment failure Day 0 email sent", {
            userId: user.id,
            subscriptionId,
            invoiceId: invoice.id,
          });
        } catch (emailError) {
          logError("Failed to send payment failure email", emailError, {
            userId: user.id,
            subscriptionId,
            invoiceId: invoice.id,
          });
          // Don't throw - email failure shouldn't fail the webhook
        }
      }
    }
  } catch (error: any) {
    logError("Error in handleInvoicePaymentFailed", error, {
      invoiceId: invoice.id,
    });
    // Re-throw so main handler can catch and return 500 for retry
    throw error;
  }
}
