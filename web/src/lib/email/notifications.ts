import { sendEmail, createEmailTemplate } from "./resend";

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
      <div style="margin: 24px 0; padding: 16px; background-color: #F3F4F6; border-left: 4px solid #8B5CF6; border-radius: 8px;">
        <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #8B5CF6; letter-spacing: 0.5px;">Fast Win</p>
        <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">${fastWin.description}</p>
        ${fastWin.personName ? `<p style="margin: 0; font-size: 14px; color: #6B7280;">${fastWin.personName}</p>` : ""}
      </div>
    `
    : "";

  const actionsList = actions.length > 0
    ? actions.map((action) => `
      <div style="margin: 12px 0; padding: 12px; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px;">
        <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500; color: #111827;">${action.description}</p>
        ${action.personName ? `<p style="margin: 0; font-size: 12px; color: #6B7280;">${action.personName}</p>` : ""}
      </div>
    `).join("")
    : "<p style=\"margin: 0; color: #6B7280;\">No additional actions today. Great job staying on top of things!</p>";

  const content = `
    <p style="margin-bottom: 16px;">
      Here's your plan for today:
    </p>
    ${focusStatement ? `<p style="margin-bottom: 16px; padding: 12px; background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 8px; font-style: italic; color: #92400E;">${focusStatement}</p>` : ""}
    ${fastWinSection}
    ${actions.length > 0 ? `<div style="margin: 24px 0;">
      <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #111827;">Today's Actions</p>
      ${actionsList}
    </div>` : ""}
  `;

  const html = createEmailTemplate({
    greeting: `Good morning, ${userName || "there"}!`,
    content,
    cta: {
      text: "View Full Plan",
      url: `${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.app"}/app/plan`,
    },
    footer: "Stay consistent. Small actions move everything forward.",
  });

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
  
  const fastWinCard = `
    <div style="margin: 24px 0; padding: 16px; background-color: #F3F4F6; border-left: 4px solid #8B5CF6; border-radius: 8px;">
      <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #8B5CF6; letter-spacing: 0.5px;">Fast Win</p>
      <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">${fastWin.description}</p>
      ${fastWin.personName ? `<p style="margin: 0; font-size: 14px; color: #6B7280;">${fastWin.personName}</p>` : ""}
    </div>
  `;

  const content = `
    <p style="margin-bottom: 16px;">
      Quick reminder: Your Fast Win for today is still waiting. Takes just 3 minutes.
    </p>
    ${fastWinCard}
  `;

  const html = createEmailTemplate({
    greeting: `Hi ${userName || "there"},`,
    content,
    cta: {
      text: "Complete Fast Win",
      url: `${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.app"}/app/plan`,
    },
    footer: "Small wins build momentum. You've got this!",
  });

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
    <div style="margin: 12px 0; padding: 12px; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px;">
      <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500; color: #111827;">${action.description}</p>
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #6B7280;">${action.personName}</p>
      <p style="margin: 0; font-size: 12px; color: #EF4444; font-weight: 500;">${action.daysOverdue} ${action.daysOverdue === 1 ? "day" : "days"} overdue</p>
    </div>
  `).join("");

  const content = `
    <p style="margin-bottom: 16px;">
      You have ${overdueActions.length} ${overdueActions.length === 1 ? "follow-up" : "follow-ups"} that need attention:
    </p>
    <div style="margin: 24px 0;">
      ${actionsList}
    </div>
  `;

  const html = createEmailTemplate({
    greeting: `Hi ${userName || "there"},`,
    content,
    cta: {
      text: "View Actions",
      url: `${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.app"}/app/actions`,
    },
    footer: "Quick follow-ups keep relationships warm. Don't let them go cold.",
  });

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
      <div style="margin: 24px 0; padding: 16px; background-color: #F3F4F6; border-radius: 8px;">
        <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #111827;">Content Ideas</p>
        ${contentPrompts.map((prompt) => `
          <div style="margin: 8px 0; padding: 12px; background-color: #FFFFFF; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #111827;">${prompt.text}</p>
          </div>
        `).join("")}
      </div>
    `
    : "";

  const content = `
    <p style="margin-bottom: 16px;">
      Here's your weekly review:
    </p>
    <div style="margin: 24px 0; padding: 16px; background-color: #F3F4F6; border-radius: 8px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div>
          <p style="margin: 0; font-size: 12px; color: #6B7280;">Days Active</p>
          <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 600; color: #111827;">${daysActive}</p>
        </div>
        <div>
          <p style="margin: 0; font-size: 12px; color: #6B7280;">Actions Completed</p>
          <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 600; color: #111827;">${actionsCompleted}</p>
        </div>
        <div>
          <p style="margin: 0; font-size: 12px; color: #6B7280;">Replies</p>
          <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 600; color: #111827;">${replies}</p>
        </div>
        <div>
          <p style="margin: 0; font-size: 12px; color: #6B7280;">Calls Booked</p>
          <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 600; color: #111827;">${callsBooked}</p>
        </div>
      </div>
    </div>
    ${insightText ? `<div style="margin: 24px 0; padding: 16px; background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 8px;">
      <p style="margin: 0; font-size: 14px; font-weight: 600; color: #92400E; margin-bottom: 8px;">This Week's Insight</p>
      <p style="margin: 0; font-size: 14px; color: #92400E; font-style: italic;">${insightText}</p>
    </div>` : ""}
    ${nextWeekFocus ? `<div style="margin: 24px 0; padding: 16px; background-color: #DBEAFE; border-left: 4px solid #2563EB; border-radius: 8px;">
      <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1E40AF; margin-bottom: 8px;">Next Week's Focus</p>
      <p style="margin: 0; font-size: 14px; color: #1E40AF;">${nextWeekFocus}</p>
    </div>` : ""}
    ${contentPromptsSection}
  `;

  const html = createEmailTemplate({
    greeting: `Hi ${userName || "there"},`,
    content,
    cta: {
      text: "View Full Review",
      url: `${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.app"}/app/weekly-review`,
    },
    footer: "Keep the momentum going. See you next week!",
  });

  return sendEmail({ to, subject, html });
}

