import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { sendPaymentFailureEmail } from "@/lib/email/resend";
import { logInfo, logError } from "@/lib/utils/logger";

/**
 * Cron job to handle payment failure recovery flow
 * Runs daily to check for users in payment failure recovery stages:
 * - Day 3: Send email + mark for modal display
 * - Day 7: Enter read-only mode
 * - Day 14: Archive account (soft delete)
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
    let day7ReadOnly = 0;
    let day14Archived = 0;
    let errors = 0;

    for (const subscription of failedSubscriptions) {
      if (!subscription.payment_failed_at) continue;

      const failureDate = new Date(subscription.payment_failed_at);
      const daysSinceFailure = Math.floor(
        (now.getTime() - failureDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const user = (subscription.billing_customers as any)?.users;
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
          const currentMetadata = (subscription as any).metadata || {};
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

        // Day 7: Enter read-only mode (similar to grace period)
        // This is handled by subscription status check - past_due status already blocks plan generation
        // We just need to ensure the status remains past_due and log it
        if (daysSinceFailure === 7) {
          // Status is already past_due, but we can add metadata to track read-only mode
          const currentMetadata = (subscription as any).metadata || {};
          const today = now.toISOString().split("T")[0]; // YYYY-MM-DD format
          const lastEmailSentDate = currentMetadata?.day7_email_sent_date;

          // Only send email if not already sent today (prevent duplicates)
          if (lastEmailSentDate !== today) {
            const { error: updateError } = await supabase
              .from("billing_subscriptions")
              .update({
                metadata: {
                  ...currentMetadata,
                  payment_failure_read_only_mode: true,
                  payment_failure_read_only_since: now.toISOString(),
                  day7_email_sent_date: today,
                },
              })
              .eq("id", subscription.id);

            if (updateError) {
              logError("Failed to update metadata for Day 7 read-only mode", updateError, {
                userId: user.id,
                subscriptionId: subscription.id,
                context: "payment_failure_recovery_cron",
              });
              throw updateError;
            }

            await sendPaymentFailureEmail({
              to: user.email,
              userName: user.name || "there",
              daysSinceFailure: 7,
            });

            logInfo("Payment failure Day 7 - read-only mode activated", {
              userId: user.id,
              subscriptionId: subscription.id,
              daysSinceFailure,
              context: "payment_failure_recovery_cron",
            });

            day7ReadOnly++;
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

        // Day 14: Archive account (soft delete - mark subscription as canceled, archive user data)
        if (daysSinceFailure === 14) {
          // Update subscription to canceled
          const currentMetadata = (subscription as any).metadata || {};
          const today = now.toISOString().split("T")[0]; // YYYY-MM-DD format
          const lastEmailSentDate = currentMetadata?.day14_email_sent_date;

          // Only send email if not already sent today (prevent duplicates)
          // But always update status to canceled if it's Day 14
          if (lastEmailSentDate !== today) {
            const { error: updateError } = await supabase
              .from("billing_subscriptions")
              .update({
                status: "canceled",
                metadata: {
                  ...currentMetadata,
                  archived_at: now.toISOString(),
                  archived_reason: "payment_failure_14_days",
                  day14_email_sent_date: today,
                },
              })
              .eq("id", subscription.id);

            if (updateError) {
              logError("Failed to archive subscription on Day 14", updateError, {
                userId: user.id,
                subscriptionId: subscription.id,
                context: "payment_failure_recovery_cron",
              });
              throw updateError;
            }

            await sendPaymentFailureEmail({
              to: user.email,
              userName: user.name || "there",
              daysSinceFailure: 14,
            });

            logInfo("Payment failure Day 14 - account archived", {
              userId: user.id,
              subscriptionId: subscription.id,
              daysSinceFailure,
              context: "payment_failure_recovery_cron",
            });

            day14Archived++;
          } else {
            // Still update status if not already canceled, but skip email
            if (subscription.status !== "canceled") {
              const { error: updateError } = await supabase
                .from("billing_subscriptions")
                .update({
                  status: "canceled",
                  metadata: {
                    ...currentMetadata,
                    archived_at: now.toISOString(),
                    archived_reason: "payment_failure_14_days",
                  },
                })
                .eq("id", subscription.id);

              if (updateError) {
                logError("Failed to archive subscription on Day 14", updateError, {
                  userId: user.id,
                  subscriptionId: subscription.id,
                  context: "payment_failure_recovery_cron",
                });
                throw updateError;
              }
            }

            logInfo("Payment failure Day 14 email already sent today, skipping", {
              userId: user.id,
              subscriptionId: subscription.id,
              daysSinceFailure,
              lastEmailSentDate,
              context: "payment_failure_recovery_cron",
            });
          }
        }
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
      day7ReadOnly,
      day14Archived,
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

