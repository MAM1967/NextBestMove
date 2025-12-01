import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { sendMorningPlanEmail } from "@/lib/email/notifications";

/**
 * GET /api/notifications/morning-plan
 * 
 * Sends morning plan emails to users who have email_morning_plan enabled.
 * Should be called by a cron job that runs frequently (e.g., every hour)
 * to catch users at 8am in their timezone.
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
    const cronSecret = process.env.CRON_SECRET;
    const cronJobOrgApiKey = process.env.CRON_JOB_ORG_API_KEY;
    
    // Check Authorization header (Vercel Cron secret or cron-job.org API key), then query param (cron-job.org secret)
    const isAuthorized = (
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      (cronJobOrgApiKey && authHeader === `Bearer ${cronJobOrgApiKey}`) ||
      (cronSecret && querySecret === cronSecret)
    );
    
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();

    // Get all users with morning plan emails enabled and not unsubscribed
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, name, timezone, email_morning_plan, email_unsubscribed")
      .eq("email_morning_plan", true)
      .eq("email_unsubscribed", false);

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
        sent: 0,
        skipped: 0,
        message: "No users with morning plan emails enabled",
      });
    }

    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];
    const skipReasons: string[] = [];

    for (const user of users) {
      try {
        // Calculate 8am in user's timezone
        const userTime = new Date(
          new Date().toLocaleString("en-US", { timeZone: user.timezone })
        );
        const userHour = userTime.getHours();
        const userMinute = userTime.getMinutes();

        // Only send if it's 8am (within a 1-hour window to account for cron frequency)
        // For testing: allow ?test=true to bypass timezone check
        const { searchParams } = new URL(request.url);
        const isTestMode = searchParams.get("test") === "true";
        
        if (!isTestMode && userHour !== 8) {
          skipReasons.push(`${user.email}: Not 8am (current hour: ${userHour})`);
          skipped++;
          continue;
        }

        // Get today's plan for the user
        const today = new Date().toISOString().split("T")[0];
        const { data: dailyPlan, error: planError } = await supabase
          .from("daily_plans")
          .select(
            `
            *,
            daily_plan_actions (
              is_fast_win,
              position,
              actions (
                *,
                person_pins (
                  id,
                  name,
                  url
                )
              )
            )
          `
          )
          .eq("user_id", user.id)
          .eq("date", today)
          .maybeSingle();

        if (planError) {
          console.error(`Error fetching plan for user ${user.id}:`, planError);
          errors.push(`User ${user.email}: ${planError.message}`);
          skipped++;
          continue;
        }

        if (!dailyPlan) {
          // No plan for today - skip
          skipReasons.push(`${user.email}: No daily plan for today`);
          skipped++;
          continue;
        }

        // Extract fast win and regular actions
        let fastWin: {
          description: string;
          personName?: string;
          url?: string;
        } | null = null;
        const actions: Array<{
          description: string;
          action_type: string;
          personName?: string;
          url?: string;
        }> = [];

        if (dailyPlan.daily_plan_actions) {
          for (const planAction of dailyPlan.daily_plan_actions) {
            const action = planAction.actions as any;
            if (!action) continue;

            const actionData = {
              description: action.description || "Action",
              action_type: action.action_type,
              personName: action.person_pins?.[0]?.name,
              url: action.person_pins?.[0]?.url,
            };

            if (planAction.is_fast_win) {
              fastWin = actionData;
            } else {
              actions.push(actionData);
            }
          }
        }

        // Send email
        await sendMorningPlanEmail({
          to: user.email,
          userName: user.name,
          planDate: today,
          fastWin,
          actions,
          focusStatement: dailyPlan.focus_statement,
        });

        sent++;
        
        // Add delay to avoid Resend rate limits (2 requests/second)
        // Wait 600ms between emails = ~1.67 requests/second (under the limit)
        if (sent < users.length) {
          await new Promise(resolve => setTimeout(resolve, 600));
        }
      } catch (error: any) {
        console.error(`Error sending email to ${user.email}:`, error);
        errors.push(`User ${user.email}: ${error.message}`);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      skipped,
      skipReasons: skipReasons.length > 0 ? skipReasons : undefined,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Error in morning plan notification job:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

