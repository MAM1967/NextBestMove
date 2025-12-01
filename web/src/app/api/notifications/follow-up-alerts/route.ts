import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { sendFollowUpAlertEmail } from "@/lib/email/notifications";

/**
 * GET /api/notifications/follow-up-alerts
 * 
 * Sends follow-up alert emails to users who have email_follow_up_alerts enabled
 * and have actions that are overdue (SENT state with no reply after due date).
 * Should be called by a cron job that runs daily.
 * 
 * This endpoint is called by Vercel Cron and requires authentication via
 * the Authorization header with a secret token.
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret (Vercel Cron sends this header)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const today = new Date().toISOString().split("T")[0];

    // Get all users with follow-up alerts enabled and not unsubscribed
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, name, email_follow_up_alerts, email_unsubscribed")
      .eq("email_follow_up_alerts", true)
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
        message: "No users with follow-up alerts enabled",
      });
    }

    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const user of users) {
      try {
        // Find overdue follow-up actions (SENT state, due_date in the past, no reply)
        const { data: overdueActions, error: actionsError } = await supabase
          .from("actions")
          .select(
            `
            *,
            person_pins (
              id,
              name,
              url
            )
          `
          )
          .eq("user_id", user.id)
          .eq("state", "SENT")
          .lt("due_date", today)
          .is("completed_at", null);

        if (actionsError) {
          console.error(`Error fetching actions for user ${user.id}:`, actionsError);
          errors.push(`User ${user.email}: ${actionsError.message}`);
          skipped++;
          continue;
        }

        if (!overdueActions || overdueActions.length === 0) {
          // No overdue actions - skip
          skipped++;
          continue;
        }

        // Calculate days overdue for each action
        const overdueActionsData = overdueActions.map((action: any) => {
          const dueDate = new Date(action.due_date);
          const todayDate = new Date(today);
          const daysOverdue = Math.floor(
            (todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          return {
            description: action.description || "Follow-up",
            personName: action.person_pins?.[0]?.name || "Contact",
            daysOverdue: Math.max(0, daysOverdue),
            url: action.person_pins?.[0]?.url,
          };
        });

        // Send email
        await sendFollowUpAlertEmail({
          to: user.email,
          userName: user.name,
          overdueActions: overdueActionsData,
        });

        sent++;
        
        // Add delay to avoid Resend rate limits (2 requests/second)
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
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Error in follow-up alerts notification job:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

