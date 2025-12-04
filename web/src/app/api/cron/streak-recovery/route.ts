import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendStreakRecoveryEmail, sendBillingPauseOfferEmail } from "@/lib/email/resend";
import { logError, logInfo } from "@/lib/utils/logger";
import { getDaysSinceLastAction } from "@/lib/plans/completion-tracking";

/**
 * Streak Break Detection & Recovery Cron Job
 * 
 * Runs daily to detect users with broken streaks and send recovery notifications
 * 
 * Day 1: Push notification (logged, push infrastructure not yet implemented)
 * Day 2: Micro Mode automatically enabled (handled by plan generation - inactive2To6Days)
 * Day 3: Send personal email via Resend
 * Day 7: Offer billing pause (if on paid plan)
 * 
 * Tracks notifications in users.metadata to avoid duplicates
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
    // Streak break = streak_count = 0 AND last_action_date >= 1 day ago
    // OR users who have never completed an action (no last_action_date but account created >= 1 day ago)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    oneDayAgo.setHours(0, 0, 0, 0); // Set to midnight for consistent comparison
    const oneDayAgoStr = oneDayAgo.toISOString().split("T")[0];

    // Get all users with broken streaks (streak_count = 0 and inactive >= 1 day)
    // Use <= to include users exactly 1 day ago
    const { data: usersWithBrokenStreaks, error: fetchError } = await supabase
      .from("users")
      .select("id, email, name, streak_count, last_action_date, created_at, metadata")
      .eq("streak_count", 0)
      .or(`last_action_date.lte.${oneDayAgoStr},last_action_date.is.null`)
      .not("created_at", "is", null);

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

    let day1Count = 0;
    let day2Count = 0;
    let day3Count = 0;
    let day7Count = 0;
    let errors: string[] = [];

    for (const user of usersWithBrokenStreaks) {
      try {
        // Get days since last action (handles both users with actions and new users)
        const daysInactive = await getDaysSinceLastAction(supabase, user.id);
        
        if (daysInactive === null) {
          // User has never completed an action - skip
          continue;
        }

        // Get notification tracking from metadata
        const metadata = (user.metadata as any) || {};
        const streakNotifications = metadata.streak_notifications || {};
        const lastNotificationDay = streakNotifications.last_day || 0;

        // Only send notification if we haven't sent one for this day yet
        if (daysInactive === 1 && lastNotificationDay < 1) {
          // Day 1: Push notification (placeholder - log for now)
          // TODO: Implement push notification infrastructure
          logInfo("Day 1 streak break - push notification (not implemented)", {
            userId: user.id,
            email: user.email,
            daysInactive: 1,
          });
          day1Count++;
          
          // Mark notification as sent
          await supabase
            .from("users")
            .update({
              metadata: {
                ...metadata,
                streak_notifications: {
                  ...streakNotifications,
                  day1_sent: true,
                  last_day: 1,
                  last_notification_date: today,
                },
              },
            })
            .eq("id", user.id);
        } else if (daysInactive === 2 && lastNotificationDay < 2) {
          // Day 2: Micro Mode is automatically enabled by plan generation
          // Just log and track that we detected Day 2
          logInfo("Day 2 streak break - Micro Mode enabled via plan generation", {
            userId: user.id,
            email: user.email,
            daysInactive: 2,
          });
          day2Count++;
          
          // Mark notification as sent
          await supabase
            .from("users")
            .update({
              metadata: {
                ...metadata,
                streak_notifications: {
                  ...streakNotifications,
                  day2_detected: true,
                  last_day: 2,
                  last_notification_date: today,
                },
              },
            })
            .eq("id", user.id);
        } else if (daysInactive === 3 && lastNotificationDay < 3) {
          // Day 3: Send recovery email
          try {
            const emailResult = await sendStreakRecoveryEmail(user.email, user.name || "there");
            day3Count++;
            logInfo("Sent Day 3 streak recovery email", { 
              userId: user.id, 
              email: user.email,
              emailId: emailResult?.id || "unknown"
            });
            
            // Mark notification as sent
            await supabase
              .from("users")
              .update({
                metadata: {
                  ...metadata,
                  streak_notifications: {
                    ...streakNotifications,
                    day3_sent: true,
                    last_day: 3,
                    last_notification_date: today,
                  },
                },
              })
              .eq("id", user.id);
          } catch (emailError) {
            const errorMessage = `Failed to send Day 3 email to ${user.email}: ${emailError instanceof Error ? emailError.message : "Unknown error"}`;
            errors.push(errorMessage);
            logError(errorMessage, emailError);
          }
        } else if (daysInactive === 7 && lastNotificationDay < 7) {
          // Day 7: Offer billing pause (check if user has active subscription)
          try {
            // Check if user has an active/trialing subscription
            const { data: billingCustomer } = await supabase
              .from("billing_customers")
              .select("id")
              .eq("user_id", user.id)
              .single();

            if (billingCustomer) {
              const { data: subscription } = await supabase
                .from("billing_subscriptions")
                .select("status")
                .eq("billing_customer_id", billingCustomer.id)
                .in("status", ["active", "trialing"])
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

              if (subscription) {
                // User has active subscription - send billing pause offer
                const emailResult = await sendBillingPauseOfferEmail({
                  to: user.email,
                  userName: user.name || "there",
                });
                day7Count++;
                logInfo("Sent Day 7 billing pause offer email", {
                  userId: user.id,
                  email: user.email,
                  emailId: emailResult?.id || "unknown",
                });
                
                // Mark notification as sent
                await supabase
                  .from("users")
                  .update({
                    metadata: {
                      ...metadata,
                      streak_notifications: {
                        ...streakNotifications,
                        day7_sent: true,
                        last_day: 7,
                        last_notification_date: today,
                      },
                    },
                  })
                  .eq("id", user.id);
              } else {
                // No active subscription - skip billing pause offer
                logInfo("Day 7 streak break - no active subscription, skipping billing pause offer", {
                  userId: user.id,
                  email: user.email,
                });
              }
            } else {
              // No billing customer - skip billing pause offer
              logInfo("Day 7 streak break - no billing customer, skipping billing pause offer", {
                userId: user.id,
                email: user.email,
              });
            }
          } catch (emailError) {
            const errorMessage = `Failed to send Day 7 billing pause email to ${user.email}: ${emailError instanceof Error ? emailError.message : "Unknown error"}`;
            errors.push(errorMessage);
            logError(errorMessage, emailError);
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
      day1PushNotifications: day1Count,
      day2MicroModeDetected: day2Count,
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

