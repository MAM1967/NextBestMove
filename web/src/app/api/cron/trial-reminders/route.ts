import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { sendTrialReminder } from "@/lib/email/resend";
import { logInfo, logError } from "@/lib/utils/logger";

/**
 * Cron job to send trial reminder emails
 * Runs daily to check for users who need reminders (Day 12 and Day 14)
 * 
 * Expected to be called by cron-job.org or similar service
 */
export async function GET(request: Request) {
  // Verify cron secret - support both Authorization header (Vercel Cron) and query param (cron-job.org)
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  // Check Authorization header first (Vercel Cron), then query param (cron-job.org)
  const isAuthorized = cronSecret && (
    authHeader === `Bearer ${cronSecret}` || 
    querySecret === cronSecret
  );

  if (!isAuthorized) {
    logError("Unauthorized cron request", undefined, {
      context: "trial_reminders_cron",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const now = new Date();
    
    // Find all users with active trialing subscriptions
    const { data: trialingSubscriptions, error: subError } = await supabase
      .from("billing_subscriptions")
      .select(
        `
        id,
        trial_ends_at,
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
      .eq("status", "trialing")
      .not("trial_ends_at", "is", null);

    if (subError) {
      logError("Error fetching trialing subscriptions", subError, {
        context: "trial_reminders_cron",
      });
      return NextResponse.json(
        { error: "Failed to fetch subscriptions" },
        { status: 500 }
      );
    }

    if (!trialingSubscriptions || trialingSubscriptions.length === 0) {
      logInfo("No trialing subscriptions found", {
        context: "trial_reminders_cron",
      });
      return NextResponse.json({ 
        success: true, 
        remindersSent: 0,
        message: "No trialing subscriptions found" 
      });
    }

    let remindersSent = 0;
    let errors = 0;

    for (const subscription of trialingSubscriptions) {
      if (!subscription.trial_ends_at) continue;

      const trialEnd = new Date(subscription.trial_ends_at);
      const daysRemaining = Math.ceil(
        (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Send reminder on Day 12 (2 days remaining) or Day 14 (0 days remaining)
      if (daysRemaining === 2 || daysRemaining === 0) {
        const user = (subscription.billing_customers as any)?.users;
        if (!user || !user.email) {
          logError("User data missing for subscription", undefined, {
            subscriptionId: subscription.id,
            context: "trial_reminders_cron",
          });
          errors++;
          continue;
        }

        try {
          await sendTrialReminder({
            to: user.email,
            userName: user.name || "there",
            daysRemaining,
          });

          logInfo("Trial reminder sent", {
            userId: user.id,
            email: user.email,
            daysRemaining,
            context: "trial_reminders_cron",
          });

          remindersSent++;
        } catch (emailError) {
          logError("Error sending trial reminder email", emailError, {
            userId: user.id,
            email: user.email,
            daysRemaining,
            context: "trial_reminders_cron",
          });
          errors++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent,
      errors,
      totalChecked: trialingSubscriptions.length,
    });
  } catch (error) {
    logError("Unexpected error in trial reminders cron", error, {
      context: "trial_reminders_cron",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

