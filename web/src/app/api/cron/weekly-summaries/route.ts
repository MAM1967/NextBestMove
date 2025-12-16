import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWeeklySummaryEmail } from "@/lib/email/notifications";

/**
 * GET /api/cron/weekly-summaries
 *
 * Cron job to generate weekly summaries for all active users.
 * Runs Monday at 1 AM UTC (Sunday night / Monday morning).
 * Generates summary for the previous week (Monday-Sunday).
 *
 * This endpoint is called by Vercel Cron and requires authentication via
 * the Authorization header with a secret token.
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret - support Authorization header (Vercel Cron or cron-job.org API key), and query param (cron-job.org)
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET?.trim().replace(/\r?\n/g, "");
    const cronJobOrgApiKey = process.env.CRON_JOB_ORG_API_KEY?.trim().replace(
      /\r?\n/g,
      ""
    );

    // Check Authorization header (Vercel Cron secret or cron-job.org API key), then query param (cron-job.org secret)
    const isAuthorized =
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      (cronJobOrgApiKey && authHeader === `Bearer ${cronJobOrgApiKey}`) ||
      (cronSecret && querySecret === cronSecret);

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Calculate previous week (Sunday to Saturday)
    // Previous week = the week that just ended (Sunday-Saturday)
    // Week structure: Sunday (0) - Saturday (6)
    // If today is Sunday, previous week's Sunday is 7 days ago
    // If today is Monday-Saturday, previous week's Sunday is (dayOfWeek + 7) days ago
    // Example: If today is Tuesday Dec 16 (day 2), last week's Sunday is Dec 7 (9 days ago = 2 + 7)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    let daysToPreviousSunday: number;

    if (dayOfWeek === 0) {
      // Sunday: previous week's Sunday is 7 days ago
      daysToPreviousSunday = 7;
    } else {
      // Monday-Saturday: previous week's Sunday is (dayOfWeek + 7) days ago
      // This ensures we go back to the previous week's Sunday, not this week's
      // Example: If today is Tuesday (day 2), previous Sunday is 2 + 7 = 9 days ago
      daysToPreviousSunday = dayOfWeek + 7;
    }

    const previousSunday = new Date(today);
    previousSunday.setDate(today.getDate() - daysToPreviousSunday);
    previousSunday.setHours(0, 0, 0, 0);

    const weekStartStr = previousSunday.toISOString().split("T")[0];

    // Get all active users with email preferences
    const { data: users, error: usersError } = await adminClient
      .from("users")
      .select("id, email, name, email_weekly_summary, email_unsubscribed")
      .order("created_at", { ascending: false });

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users", details: usersError.message },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users found",
        generated: 0,
      });
    }

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    let emailsSent = 0;
    const errors: Array<{ userId: string; error: string }> = [];

    // Generate summaries for each user
    const { generateWeeklySummaryForUser } = await import(
      "@/lib/summaries/generate-weekly-summary"
    );

    for (const user of users) {
      try {
        const result = await generateWeeklySummaryForUser(
          adminClient,
          user.id,
          weekStartStr
        );

        if (!result.success) {
          // Skip if summary already exists (not an error)
          if (result.error?.includes("already exists")) {
            skippedCount++;
            // Still try to send email if summary exists
            if (user.email_weekly_summary && !user.email_unsubscribed) {
              try {
                await sendEmailForWeeklySummary(
                  adminClient,
                  user,
                  weekStartStr
                );
                emailsSent++;
              } catch (emailError) {
                console.error(
                  `Error sending email to ${user.email}:`,
                  emailError
                );
              }
            }
            continue;
          }
          errorCount++;
          errors.push({
            userId: user.id,
            error: result.error || "Unknown error",
          });
        } else {
          successCount++;

          // Send email if user has email_weekly_summary enabled
          if (user.email_weekly_summary && !user.email_unsubscribed) {
            try {
              await sendEmailForWeeklySummary(adminClient, user, weekStartStr);
              emailsSent++;
            } catch (emailError) {
              console.error(
                `Error sending email to ${user.email}:`,
                emailError
              );
              // Don't fail the whole job if email fails
            }
          }
        }
      } catch (error) {
        errorCount++;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        errors.push({ userId: user.id, error: errorMessage });
        console.error(`Error generating summary for user ${user.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      weekStartDate: weekStartStr,
      totalUsers: users.length,
      generated: successCount,
      skipped: skippedCount,
      emailsSent,
      errors: errorCount,
      errorDetails: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to send weekly summary email
 */
async function sendEmailForWeeklySummary(
  adminClient: any,
  user: { id: string; email: string; name: string },
  weekStartStr: string
) {
  // Fetch the weekly summary
  const { data: summary, error: summaryError } = await adminClient
    .from("weekly_summaries")
    .select("*")
    .eq("user_id", user.id)
    .eq("week_start_date", weekStartStr)
    .maybeSingle();

  if (summaryError || !summary) {
    throw new Error(summaryError?.message || "Summary not found");
  }

  // Parse content prompts if they exist
  let contentPrompts: Array<{ type: string; text: string }> | null = null;
  if (summary.content_prompts && Array.isArray(summary.content_prompts)) {
    contentPrompts = summary.content_prompts;
  }

  // Send email
  await sendWeeklySummaryEmail({
    to: user.email,
    userName: user.name,
    weekStartDate: weekStartStr,
    daysActive: summary.days_active || 0,
    actionsCompleted: summary.actions_completed || 0,
    replies: summary.replies || 0,
    callsBooked: summary.calls_booked || 0,
    insightText: summary.insight_text,
    nextWeekFocus: summary.next_week_focus,
    contentPrompts,
  });
}
