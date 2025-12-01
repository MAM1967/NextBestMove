import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { sendWinBackEmail } from "@/lib/email/resend";
import { logInfo, logError } from "@/lib/utils/logger";

/**
 * Cron job to send win-back campaign emails
 * Runs daily to check for users who canceled subscriptions:
 * - Day 7: "What didn't work for you?" + feedback request
 * - Day 30: "We shipped updates" + new features
 * - Day 90: "Your data is still here" + reactivation CTA
 * - Day 180: "Should we delete your data?" + final offer
 * 
 * Only sends to users who canceled (not payment failures)
 * 
 * Expected to be called by cron-job.org or similar service
 */
export async function GET(request: Request) {
  // Verify cron secret - support both Authorization header (Vercel Cron) and query param (cron-job.org)
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;
  const cronJobOrgApiKey = process.env.CRON_JOB_ORG_API_KEY;

  // Check Authorization header (Vercel Cron secret or cron-job.org API key), then query param (cron-job.org secret)
  const isAuthorized = (
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (cronJobOrgApiKey && authHeader === `Bearer ${cronJobOrgApiKey}`) ||
    (cronSecret && querySecret === cronSecret)
  );

  if (!isAuthorized) {
    logError("Unauthorized cron request", undefined, {
      context: "win_back_campaign_cron",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const now = new Date();
    
    // Find all canceled subscriptions
    // Use updated_at as cancellation date (when status changed to canceled)
    const { data: canceledSubscriptions, error: subError } = await supabase
      .from("billing_subscriptions")
      .select(
        `
        id,
        updated_at,
        status,
        payment_failed_at,
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
      .eq("status", "canceled")
      .not("updated_at", "is", null);

    if (subError) {
      logError("Error fetching canceled subscriptions", subError, {
        context: "win_back_campaign_cron",
      });
      return NextResponse.json(
        { error: "Failed to fetch subscriptions" },
        { status: 500 }
      );
    }

    if (!canceledSubscriptions || canceledSubscriptions.length === 0) {
      logInfo("No canceled subscriptions found", {
        context: "win_back_campaign_cron",
      });
      return NextResponse.json({ 
        success: true, 
        emailsSent: 0,
        message: "No canceled subscriptions found" 
      });
    }

    let day7Emails = 0;
    let day30Emails = 0;
    let day90Emails = 0;
    let day180Emails = 0;
    let errors = 0;
    let skipped = 0;

    for (const subscription of canceledSubscriptions) {
      // Skip if this was a payment failure cancellation (not voluntary cancellation)
      if (subscription.payment_failed_at) {
        skipped++;
        continue;
      }

      if (!subscription.updated_at) continue;

      const canceledDate = new Date(subscription.updated_at);
      const daysSinceCancellation = Math.floor(
        (now.getTime() - canceledDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const user = (subscription.billing_customers as any)?.users;
      if (!user || !user.email) {
        logError("User data missing for subscription", undefined, {
          subscriptionId: subscription.id,
          context: "win_back_campaign_cron",
        });
        errors++;
        continue;
      }

      // Only send on specific days: 7, 30, 90, 180
      if (
        daysSinceCancellation !== 7 &&
        daysSinceCancellation !== 30 &&
        daysSinceCancellation !== 90 &&
        daysSinceCancellation !== 180
      ) {
        continue;
      }

      try {
        await sendWinBackEmail({
          to: user.email,
          userName: user.name || "there",
          daysSinceCancellation,
        });

        logInfo("Win-back email sent", {
          userId: user.id,
          subscriptionId: subscription.id,
          daysSinceCancellation,
          context: "win_back_campaign_cron",
        });

        if (daysSinceCancellation === 7) day7Emails++;
        else if (daysSinceCancellation === 30) day30Emails++;
        else if (daysSinceCancellation === 90) day90Emails++;
        else if (daysSinceCancellation === 180) day180Emails++;
      } catch (emailError) {
        logError("Error sending win-back email", emailError, {
          userId: user.id,
          subscriptionId: subscription.id,
          daysSinceCancellation,
          context: "win_back_campaign_cron",
        });
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: canceledSubscriptions.length,
      day7Emails,
      day30Emails,
      day90Emails,
      day180Emails,
      skipped, // Payment failure cancellations
      errors,
    });
  } catch (error) {
    logError("Unexpected error in win-back campaign cron", error, {
      context: "win_back_campaign_cron",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

