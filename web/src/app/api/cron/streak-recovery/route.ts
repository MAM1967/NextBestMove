import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendStreakRecoveryEmail } from "@/lib/email/resend";
import { logError, logInfo } from "@/lib/utils/logger";

/**
 * Streak Break Detection & Recovery Cron Job
 * 
 * Runs daily to detect users with broken streaks and send recovery emails
 * 
 * Day 1: Push notification (if available) - skipped for now
 * Day 2: Enable Micro Mode automatically (handled by plan generation)
 * Day 3: Send personal email via Resend
 * Day 7: Offer billing pause (if on paid plan) - TODO: implement billing pause
 */
export async function GET(request: NextRequest) {
  // Authentication
  const authHeader = request.headers.get("authorization");
  const secret = request.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET?.trim().replace(/\r?\n/g, '');
  const cronJobOrgApiKey = process.env.CRON_JOB_ORG_API_KEY?.trim().replace(/\r?\n/g, '');

  const isAuthorized =
    (authHeader === `Bearer ${cronSecret}`) ||
    (secret === cronSecret) ||
    (authHeader === `Bearer ${cronJobOrgApiKey}`);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const today = new Date().toISOString().split("T")[0];

    logInfo("Streak recovery cron job started", { date: today });

    // Find users with broken streaks
    // Streak break = streak_count = 0 AND last_action_date > 1 day ago
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const oneDayAgoStr = oneDayAgo.toISOString().split("T")[0];

    const { data: usersWithBrokenStreaks, error: fetchError } = await supabase
      .from("users")
      .select("id, email, name, streak_count, last_action_date, created_at")
      .eq("streak_count", 0)
      .not("last_action_date", "is", null)
      .lt("last_action_date", oneDayAgoStr);

    if (fetchError) {
      logError("Failed to fetch users with broken streaks", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch users", details: fetchError.message },
        { status: 500 }
      );
    }

    if (!usersWithBrokenStreaks || usersWithBrokenStreaks.length === 0) {
      logInfo("No users with broken streaks found", { date: today });
      return NextResponse.json({
        success: true,
        message: "No users with broken streaks",
        processed: 0,
      });
    }

    logInfo(`Found ${usersWithBrokenStreaks.length} users with broken streaks`);

    let day3Count = 0;
    let day7Count = 0;
    let errors: string[] = [];

    for (const user of usersWithBrokenStreaks) {
      try {
        if (!user.last_action_date) {
          // Check account creation date instead
          const createdDate = new Date(user.created_at);
          const daysSinceCreation = Math.floor(
            (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceCreation === 3) {
            // Day 3: Send recovery email
            try {
              const emailResult = await sendStreakRecoveryEmail(user.email, user.name || "there");
              day3Count++;
              logInfo("Sent Day 3 streak recovery email", { 
                userId: user.id, 
                email: user.email,
                emailId: emailResult?.id || "unknown"
              });
            } catch (emailError) {
              const errorMessage = `Failed to send Day 3 email to ${user.email}: ${emailError instanceof Error ? emailError.message : "Unknown error"}`;
              errors.push(errorMessage);
              logError(errorMessage, emailError);
              // Don't increment day3Count if email failed
            }
          } else if (daysSinceCreation === 7) {
            // Day 7: Offer billing pause (TODO: implement billing pause)
            // For now, just log
            day7Count++;
            logInfo("Day 7 streak break - billing pause offer (not implemented)", {
              userId: user.id,
              email: user.email,
            });
          }
        } else {
          const lastActionDate = new Date(user.last_action_date);
          const daysSinceLastAction = Math.floor(
            (Date.now() - lastActionDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceLastAction === 3) {
            // Day 3: Send recovery email
            try {
              const emailResult = await sendStreakRecoveryEmail(user.email, user.name || "there");
              day3Count++;
              logInfo("Sent Day 3 streak recovery email", { 
                userId: user.id, 
                email: user.email,
                emailId: emailResult?.id || "unknown"
              });
            } catch (emailError) {
              const errorMessage = `Failed to send Day 3 email to ${user.email}: ${emailError instanceof Error ? emailError.message : "Unknown error"}`;
              errors.push(errorMessage);
              logError(errorMessage, emailError);
              // Don't increment day3Count if email failed
            }
          } else if (daysSinceLastAction === 7) {
            // Day 7: Offer billing pause (TODO: implement billing pause)
            // For now, just log
            day7Count++;
            logInfo("Day 7 streak break - billing pause offer (not implemented)", {
              userId: user.id,
              email: user.email,
            });
          }
        }
      } catch (error) {
        const errorMessage = `Failed to process user ${user.id}: ${error instanceof Error ? error.message : "Unknown error"}`;
        errors.push(errorMessage);
        logError(errorMessage, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Streak recovery cron completed",
      processed: usersWithBrokenStreaks.length,
      day3EmailsSent: day3Count,
      day7BillingPauseOffers: day7Count,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    logError("Streak recovery cron job failed", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

