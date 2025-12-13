import { sendEmail } from "./resend";

/**
 * Email template for morning plan notification
 * Sent daily at 8am in user's timezone
 */
export async function sendMorningPlanEmail({
  to,
  userName,
  planDate,
  fastWin,
  actions,
  focusStatement,
}: {
  to: string;
  userName: string;
  planDate: string;
  fastWin?: {
    description: string;
    personName?: string;
    url?: string;
  } | null;
  actions: Array<{
    description: string;
    action_type: string;
    personName?: string;
    url?: string;
  }>;
  focusStatement?: string | null;
}) {
  const subject = `Your NextBestMove for ${new Date(planDate).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`;
  
  const fastWinSection = fastWin
    ? `
      <div style="margin: 24px 0; padding: 16px; background-color: #f3f4f6; border-left: 4px solid #9333ea; border-radius: 6px;">
        <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #9333ea; letter-spacing: 0.5px;">Fast Win</p>
        <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">${fastWin.description}</p>
        ${fastWin.personName ? `<p style="margin: 0; font-size: 14px; color: #6b7280;">${fastWin.personName}</p>` : ""}
      </div>
    `
    : "";

  const actionsList = actions.length > 0
    ? actions.map((action) => `
      <div style="margin: 12px 0; padding: 12px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px;">
        <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500; color: #111827;">${action.description}</p>
        ${action.personName ? `<p style="margin: 0; font-size: 12px; color: #6b7280;">${action.personName}</p>` : ""}
      </div>
    `).join("")
    : "<p style=\"margin: 0; color: #6b7280;\">No additional actions today. Great job staying on top of things!</p>";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #111827; font-size: 24px; margin-bottom: 16px;">Good morning, ${userName || "there"}!</h1>
        
        <p style="margin-bottom: 16px;">
          Here's your plan for today:
        </p>

        ${focusStatement ? `<p style="margin-bottom: 16px; padding: 12px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; font-style: italic; color: #92400e;">${focusStatement}</p>` : ""}

        ${fastWinSection}

        ${actions.length > 0 ? `<div style="margin: 24px 0;">
          <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #111827;">Today's Actions</p>
          ${actionsList}
        </div>` : ""}
        
        <div style="margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.app"}/app/plan" 
             style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            View Full Plan
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
          Stay consistent. Small actions move everything forward.
        </p>
      </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

/**
 * Email template for fast win reminder
 * Sent at 2pm if fast win hasn't been completed
 */
export async function sendFastWinReminderEmail({
  to,
  userName,
  fastWin,
}: {
  to: string;
  userName: string;
  fastWin: {
    description: string;
    personName?: string;
    url?: string;
  };
}) {
  const subject = "Your Fast Win is waiting — 3 minutes";
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #111827; font-size: 24px; margin-bottom: 16px;">Hi ${userName || "there"},</h1>
        
        <p style="margin-bottom: 16px;">
          Quick reminder: Your Fast Win for today is still waiting. Takes just 3 minutes.
        </p>

        <div style="margin: 24px 0; padding: 16px; background-color: #f3f4f6; border-left: 4px solid #9333ea; border-radius: 6px;">
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #9333ea; letter-spacing: 0.5px;">Fast Win</p>
          <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">${fastWin.description}</p>
          ${fastWin.personName ? `<p style="margin: 0; font-size: 14px; color: #6b7280;">${fastWin.personName}</p>` : ""}
        </div>
        
        <div style="margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.app"}/app/plan" 
             style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Complete Fast Win
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
          Small wins build momentum. You've got this!
        </p>
      </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

/**
 * Email template for follow-up alerts
 * Sent when replies are overdue
 */
export async function sendFollowUpAlertEmail({
  to,
  userName,
  overdueActions,
}: {
  to: string;
  userName: string;
  overdueActions: Array<{
    description: string;
    personName: string;
    daysOverdue: number;
    url?: string;
  }>;
}) {
  const subject = overdueActions.length === 1
    ? `Follow-up reminder: ${overdueActions[0].personName}`
    : `${overdueActions.length} follow-ups need your attention`;

  const actionsList = overdueActions.map((action) => `
    <div style="margin: 12px 0; padding: 12px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px;">
      <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500; color: #111827;">${action.description}</p>
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">${action.personName}</p>
      <p style="margin: 0; font-size: 12px; color: #dc2626; font-weight: 500;">${action.daysOverdue} ${action.daysOverdue === 1 ? "day" : "days"} overdue</p>
    </div>
  `).join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #111827; font-size: 24px; margin-bottom: 16px;">Hi ${userName || "there"},</h1>
        
        <p style="margin-bottom: 16px;">
          You have ${overdueActions.length} ${overdueActions.length === 1 ? "follow-up" : "follow-ups"} that need attention:
        </p>

        <div style="margin: 24px 0;">
          ${actionsList}
        </div>
        
        <div style="margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.app"}/app/actions" 
             style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            View Actions
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
          Quick follow-ups keep relationships warm. Don't let them go cold.
        </p>
      </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

/**
 * Email template for weekly summary
 * Sent Sunday night
 */
export async function sendWeeklySummaryEmail({
  to,
  userName,
  weekStartDate,
  daysActive,
  actionsCompleted,
  replies,
  callsBooked,
  insightText,
  nextWeekFocus,
  contentPrompts,
}: {
  to: string;
  userName: string;
  weekStartDate: string;
  daysActive: number;
  actionsCompleted: number;
  replies: number;
  callsBooked: number;
  insightText?: string | null;
  nextWeekFocus?: string | null;
  contentPrompts?: Array<{ type: string; text: string }> | null;
}) {
  const subject = `Your week in review — ${new Date(weekStartDate).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`;
  
  const contentPromptsSection = contentPrompts && contentPrompts.length > 0
    ? `
      <div style="margin: 24px 0; padding: 16px; background-color: #f3f4f6; border-radius: 6px;">
        <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #111827;">Content Ideas</p>
        ${contentPrompts.map((prompt) => `
          <div style="margin: 8px 0; padding: 12px; background-color: #ffffff; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #111827;">${prompt.text}</p>
          </div>
        `).join("")}
      </div>
    `
    : "";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #111827; font-size: 24px; margin-bottom: 16px;">Hi ${userName || "there"},</h1>
        
        <p style="margin-bottom: 16px;">
          Here's your weekly review:
        </p>

        <div style="margin: 24px 0; padding: 16px; background-color: #f3f4f6; border-radius: 6px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Days Active</p>
              <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 600; color: #111827;">${daysActive}</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Actions Completed</p>
              <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 600; color: #111827;">${actionsCompleted}</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Replies</p>
              <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 600; color: #111827;">${replies}</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Calls Booked</p>
              <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 600; color: #111827;">${callsBooked}</p>
            </div>
          </div>
        </div>

        ${insightText ? `<div style="margin: 24px 0; padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px;">
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #92400e; margin-bottom: 8px;">This Week's Insight</p>
          <p style="margin: 0; font-size: 14px; color: #92400e; font-style: italic;">${insightText}</p>
        </div>` : ""}

        ${nextWeekFocus ? `<div style="margin: 24px 0; padding: 16px; background-color: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 6px;">
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1e40af; margin-bottom: 8px;">Next Week's Focus</p>
          <p style="margin: 0; font-size: 14px; color: #1e40af;">${nextWeekFocus}</p>
        </div>` : ""}

        ${contentPromptsSection}
        
        <div style="margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.app"}/app/weekly-review" 
             style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            View Full Review
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
          Keep the momentum going. See you next week!
        </p>
      </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

