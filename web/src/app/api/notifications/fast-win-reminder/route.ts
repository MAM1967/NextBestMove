import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { sendFastWinReminderEmail } from "@/lib/email/notifications";

/**
 * GET /api/notifications/fast-win-reminder
 * 
 * Sends fast win reminder emails at 2pm to users who have email_fast_win_reminder enabled
 * and haven't completed their fast win yet.
 * Should be called by a cron job that runs frequently (e.g., every hour)
 * to catch users at 2pm in their timezone.
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
    const cronSecret = process.env.CRON_SECRET?.trim().replace(/\r?\n/g, '');
    const cronJobOrgApiKey = process.env.CRON_JOB_ORG_API_KEY?.trim().replace(/\r?\n/g, '');
    
    // Debug logging for production (to diagnose authorization issues)
    const hostname = new URL(request.url).hostname;
    const isProduction = hostname === "nextbestmove.app";
    if (isProduction) {
      console.log("[Fast Win Reminder] Auth Debug:", {
        hasAuthHeader: !!authHeader,
        authHeaderLength: authHeader?.length || 0,
        authHeaderPrefix: authHeader?.substring(0, 30) || "none",
        hasQuerySecret: !!querySecret,
        querySecretLength: querySecret?.length || 0,
        hasCronSecret: !!cronSecret,
        cronSecretLength: cronSecret?.length || 0,
        hasCronJobOrgApiKey: !!cronJobOrgApiKey,
        cronJobOrgApiKeyLength: cronJobOrgApiKey?.length || 0,
      });
    }
    
    // Check Authorization header (Vercel Cron secret or cron-job.org API key), then query param (cron-job.org secret)
    const isAuthorized = (
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      (cronJobOrgApiKey && authHeader === `Bearer ${cronJobOrgApiKey}`) ||
      (cronSecret && querySecret === cronSecret)
    );
    
    if (!isAuthorized) {
      if (isProduction) {
        console.log("[Fast Win Reminder] Authorization failed:", {
          authHeaderMatchesCronSecret: cronSecret ? authHeader === `Bearer ${cronSecret}` : false,
          authHeaderMatchesApiKey: cronJobOrgApiKey ? authHeader === `Bearer ${cronJobOrgApiKey}` : false,
          querySecretMatches: cronSecret ? querySecret === cronSecret : false,
        });
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const today = new Date().toISOString().split("T")[0];

    // Get all users with fast win reminder emails enabled and not unsubscribed
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, name, timezone, email_fast_win_reminder, email_unsubscribed")
      .eq("email_fast_win_reminder", true)
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
        message: "No users with fast win reminder emails enabled",
      });
    }

    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const user of users) {
      try {
        // Calculate 2pm in user's timezone
        const userTime = new Date(
          new Date().toLocaleString("en-US", { timeZone: user.timezone })
        );
        const userHour = userTime.getHours();

        // Only send if it's 2pm (within a 1-hour window to account for cron frequency)
        if (userHour !== 14) {
          skipped++;
          continue;
        }

        // Get today's plan for the user
        const { data: dailyPlan, error: planError } = await supabase
          .from("daily_plans")
          .select(
            `
            *,
            daily_plan_actions (
              is_fast_win,
              actions (
                *,
                leads (
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
          skipped++;
          continue;
        }

        // Find fast win action
        const fastWinAction = dailyPlan.daily_plan_actions?.find(
          (pa: { is_fast_win: boolean; actions: unknown }) => pa.is_fast_win && pa.actions
        );

        if (!fastWinAction || !fastWinAction.actions) {
          // No fast win - skip
          skipped++;
          continue;
        }

        type ActionWithLeads = {
          id: string;
          action_type: string;
          state: string;
          description?: string;
          leads?: { id: string; name: string } | null;
          [key: string]: unknown;
        };
        const action = fastWinAction.actions as ActionWithLeads;

        // Check if fast win is already completed
        if (action.state === "DONE" || action.state === "SENT" || action.completed_at) {
          // Fast win already completed - skip
          skipped++;
          continue;
        }

        // Send email
        await sendFastWinReminderEmail({
          to: user.email,
          userName: user.name,
          fastWin: {
            description: action.description || "Fast Win",
            personName: action.leads?.[0]?.name,
            url: action.leads?.[0]?.url,
          },
        });

        sent++;
        
        // Add delay to avoid Resend rate limits (2 requests/second)
        if (sent < users.length) {
          await new Promise(resolve => setTimeout(resolve, 600));
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error sending email to ${user.email}:`, error);
        errors.push(`User ${user.email}: ${error.message}`);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Error in fast win reminder notification job:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

