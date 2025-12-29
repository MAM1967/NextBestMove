import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { sendPaymentFailureEmail } from "@/lib/email/resend";
import { logInfo, logError } from "@/lib/utils/logger";

/**
 * Cron job to handle payment failure recovery flow
 * Runs daily to check for users in payment failure recovery stages:
 * - Day 3: Send email + mark for modal display
 * - Day 7: Send final reminder email
 * 
 * Expected to be called by cron-job.org or similar service
 */
export async function GET(request: Request) {
  // Verify cron secret - support both Authorization header (Vercel Cron) and query param (cron-job.org)
  // Trim whitespace/newlines from env vars (Vercel sometimes adds trailing newlines)
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET?.trim().replace(/\r?\n/g, '');
  const cronJobOrgApiKey = process.env.CRON_JOB_ORG_API_KEY?.trim().replace(/\r?\n/g, '');

  // Check Authorization header (Vercel Cron secret or cron-job.org API key), then query param (cron-job.org secret)
  const isAuthorized = (
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (cronJobOrgApiKey && authHeader === `Bearer ${cronJobOrgApiKey}`) ||
    (cronSecret && querySecret === cronSecret)
  );

  if (!isAuthorized) {
    logError("Unauthorized cron request", undefined, {
      context: "payment_failure_recovery_cron",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const now = new Date();
    
    // Find all subscriptions with payment failures
    const { data: failedSubscriptions, error: subError } = await supabase
      .from("billing_subscriptions")
      .select(
        `
        id,
        payment_failed_at,
        status,
        metadata,
        billing_customer_id,
        billing_customers!inner (
          user_id,
          users!inner (
            id,
            email,
            name
          )
        )
      `
      )
      .eq("status", "past_due")
      .not("payment_failed_at", "is", null);

    if (subError) {
      logError("Error fetching failed subscriptions", subError, {
        context: "payment_failure_recovery_cron",
      });
      return NextResponse.json(
        { error: "Failed to fetch subscriptions" },
        { status: 500 }
      );
    }

    if (!failedSubscriptions || failedSubscriptions.length === 0) {
      logInfo("No payment failures found", {
        context: "payment_failure_recovery_cron",
      });
      return NextResponse.json({ 
        success: true, 
        processed: 0,
        message: "No payment failures found" 
      });
    }

    let day3Emails = 0;
    let day7Emails = 0;
    let errors = 0;

    for (const subscription of failedSubscriptions) {
      if (!subscription.payment_failed_at) continue;

      const failureDate = new Date(subscription.payment_failed_at);
      const daysSinceFailure = Math.floor(
        (now.getTime() - failureDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      type BillingCustomerWithUser = {
        users?: { id: string; email?: string; name?: string | null };
      };
      const user = (subscription.billing_customers as BillingCustomerWithUser | null)?.users;
      if (!user || !user.email) {
        logError("User data missing for subscription", undefined, {
          subscriptionId: subscription.id,
          context: "payment_failure_recovery_cron",
        });
        errors++;
        continue;
      }

      try {
        // Day 3: Send email + mark for modal display (stored in metadata)
        if (daysSinceFailure === 3) {
          type SubscriptionMetadata = {
            day3_email_sent_date?: string;
            show_payment_failure_modal?: boolean;
            payment_failure_modal_shown_at?: string;
            [key: string]: unknown;
          };
          const currentMetadata = (subscription.metadata as SubscriptionMetadata | null) || {};
          const today = now.toISOString().split("T")[0]; // YYYY-MM-DD format
          const lastEmailSentDate = currentMetadata?.day3_email_sent_date;

          // Only send email if not already sent today (prevent duplicates)
          if (lastEmailSentDate !== today) {
            await sendPaymentFailureEmail({
              to: user.email,
              userName: user.name || "there",
              daysSinceFailure: 3,
            });

            // Mark subscription for Day 3 modal display (store in metadata)
            const { error: updateError } = await supabase
              .from("billing_subscriptions")
              .update({
                metadata: {
                  ...currentMetadata,
                  show_payment_failure_modal: true,
                  payment_failure_modal_shown_at: now.toISOString(),
                  day3_email_sent_date: today,
                },
              })
              .eq("id", subscription.id);

            if (updateError) {
              logError("Failed to update metadata for Day 3 modal", updateError, {
                userId: user.id,
                subscriptionId: subscription.id,
                context: "payment_failure_recovery_cron",
              });
              throw updateError;
            }

            logInfo("Payment failure Day 3 email sent", {
              userId: user.id,
              subscriptionId: subscription.id,
              daysSinceFailure,
              context: "payment_failure_recovery_cron",
            });

            day3Emails++;
          } else {
            logInfo("Payment failure Day 3 email already sent today, skipping", {
              userId: user.id,
              subscriptionId: subscription.id,
              daysSinceFailure,
              lastEmailSentDate,
              context: "payment_failure_recovery_cron",
            });
          }
        }

        // Day 7: Send final reminder email (user is on Free tier)
        if (daysSinceFailure === 7) {
          type SubscriptionMetadata = {
            day7_email_sent_date?: string;
            [key: string]: unknown;
          };
          const currentMetadata = (subscription.metadata as SubscriptionMetadata | null) || {};
          const today = now.toISOString().split("T")[0]; // YYYY-MM-DD format
          const lastEmailSentDate = currentMetadata?.day7_email_sent_date;

          // Only send email if not already sent today (prevent duplicates)
          if (lastEmailSentDate !== today) {
            // Send email (with error handling)
            try {
              await sendPaymentFailureEmail({
                to: user.email,
                userName: user.name || "there",
                daysSinceFailure: 7,
              });

              // Mark email as sent
              await supabase
                .from("billing_subscriptions")
                .update({
                  metadata: {
                    ...currentMetadata,
                    day7_email_sent_date: today,
                  },
                })
                .eq("id", subscription.id);

              logInfo("Payment failure Day 7 email sent", {
                userId: user.id,
                subscriptionId: subscription.id,
                daysSinceFailure,
                email: user.email,
                context: "payment_failure_recovery_cron",
              });

              day7Emails++;
            } catch (emailError) {
              logError("Failed to send Day 7 payment failure email", emailError, {
                userId: user.id,
                subscriptionId: subscription.id,
                email: user.email,
                daysSinceFailure,
                context: "payment_failure_recovery_cron",
              });
              // Don't throw - continue processing other subscriptions
            }
          } else {
            logInfo("Payment failure Day 7 email already sent today, skipping", {
              userId: user.id,
              subscriptionId: subscription.id,
              daysSinceFailure,
              lastEmailSentDate,
              context: "payment_failure_recovery_cron",
            });
          }
        }

        // Day 14: No longer sending email or archiving - users stay on Free tier
        // Removed Day 14 logic per user request - Free tier is available forever
      } catch (error) {
        logError("Error processing payment failure recovery", error, {
          userId: user.id,
          subscriptionId: subscription.id,
          daysSinceFailure,
          context: "payment_failure_recovery_cron",
        });
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: failedSubscriptions.length,
      day3Emails,
      day7Emails,
      errors,
    });
  } catch (error) {
    logError("Unexpected error in payment failure recovery cron", error, {
      context: "payment_failure_recovery_cron",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

