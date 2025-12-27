import { Resend } from "resend";

// Initialize Resend client
// Handle missing API key gracefully for local development
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.warn("⚠️ RESEND_API_KEY is not set. Email sending will fail.");
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Detect staging environment
const isStaging = 
  process.env.VERCEL_ENV === "preview" ||
  process.env.NEXT_PUBLIC_APP_URL?.includes("staging.nextbestmove.app") ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === "staging";

// Default from address (using verified domain)
// Use staging domain when in staging environment
const DEFAULT_FROM = isStaging
  ? "NextBestMove <noreply@staging.nextbestmove.app>"
  : "NextBestMove <noreply@nextbestmove.app>";

/**
 * Add [STAGING] prefix to email subject when in staging
 */
function formatSubject(subject: string): string {
  if (isStaging && !subject.startsWith("[STAGING]")) {
    return `[STAGING] ${subject}`;
  }
  return subject;
}

/**
 * Shared email template helper with brand styling
 * Uses design tokens from design.tokens.json
 */
export function createEmailTemplate({
  greeting,
  content,
  cta,
  footer,
}: {
  greeting: string;
  content: string;
  cta?: { text: string; url: string } | null;
  footer?: string | null;
}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.app";
  
  // Design tokens
  const colors = {
    primary: "#2563EB", // primary-blue
    primaryHover: "#1D4ED8", // primary-blue-hover
    text: "#1F2937", // gray-700
    textLight: "#6B7280", // gray-500
    heading: "#111827", // gray-800
    background: "#FFFFFF", // white
    border: "#E5E7EB", // gray-200
  };
  
  const spacing = {
    xs: "4px",
    sm: "8px",
    md: "12px",
    base: "16px",
    lg: "24px",
    xl: "32px",
  };
  
  const radius = {
    base: "8px",
    md: "12px",
  };

  const ctaButton = cta
    ? `
      <div style="margin: ${spacing.xl} 0;">
        <a href="${cta.url}" 
           style="display: inline-block; background-color: ${colors.primary}; color: #ffffff; padding: ${spacing.md} ${spacing.lg}; text-decoration: none; border-radius: ${radius.base}; font-weight: 600; font-size: 16px;">
          ${cta.text}
        </a>
      </div>
    `
    : "";

  const footerText = footer
    ? `
      <p style="color: ${colors.textLight}; font-size: 14px; margin-top: ${spacing.xl}; line-height: 1.5;">
        ${footer}
      </p>
    `
    : "";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light">
        <meta name="supported-color-schemes" content="light">
      </head>
      <body style="margin: 0; padding: 0; background-color: #F9FAFB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #F9FAFB; padding: ${spacing.xl} ${spacing.base};">
          <tr>
            <td align="center" style="padding: ${spacing.xl} 0;">
              <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: ${colors.background}; border-radius: ${radius.md}; overflow: hidden;">
                <!-- Header with Logo -->
                <tr>
                  <td style="padding: ${spacing.xl} ${spacing.xl} ${spacing.lg} ${spacing.xl}; border-bottom: 1px solid ${colors.border};">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="vertical-align: middle;">
                          <div style="display: inline-block; width: 24px; height: 24px; background-color: #000000; border-radius: 4px; margin-right: ${spacing.sm}; vertical-align: middle;"></div>
                          <span style="font-size: 16px; font-weight: 600; color: ${colors.heading}; letter-spacing: 0.5px; vertical-align: middle;">NEXTBESTMOVE</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: ${spacing.xl};">
                    <h1 style="color: ${colors.heading}; font-size: 24px; font-weight: 600; margin: 0 0 ${spacing.base} 0; line-height: 1.3;">
                      ${greeting}
                    </h1>
                    
                    <div style="color: ${colors.text}; font-size: 16px; line-height: 1.6; margin-bottom: ${spacing.base};">
                      ${content}
                    </div>
                    
                    ${ctaButton}
                    
                    ${footerText}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

/**
 * Send an email using Resend
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = DEFAULT_FROM,
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  if (!resend) {
    throw new Error("RESEND_API_KEY is not set. Please add it to your environment variables.");
  }

  try {
    // Format subject with [STAGING] prefix if in staging
    const formattedSubject = formatSubject(subject);

    console.log("📧 Attempting to send email via Resend:", {
      to,
      from,
      subject: formattedSubject,
      originalSubject: subject,
      isStaging,
      hasApiKey: !!resendApiKey,
    });

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: formattedSubject,
      html,
    });

    if (error) {
      console.error("❌ Resend email error:", {
        message: error.message,
        name: error.name,
        error: JSON.stringify(error, null, 2),
      });
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("✅ Email sent successfully via Resend:", {
      emailId: data?.id,
      to,
      subject: formattedSubject,
      from,
      isStaging,
    });

    return data;
  } catch (error) {
    console.error("❌ Error sending email:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      to,
      subject,
    });
    throw error;
  }
}

/**
 * Email template for trial reminders
 * Day 12: 2 days remaining (encouraging)
 * Day 14: 0 days remaining (urgent)
 */
export async function sendTrialReminder({
  to,
  userName,
  daysRemaining,
}: {
  to: string;
  userName: string;
  daysRemaining: number;
}) {
  const isDay12 = daysRemaining === 2;
  const isDay14 = daysRemaining === 0;

  const subject = isDay12
    ? "2 days left in your Standard trial — Keep your rhythm going"
    : isDay14
    ? "Last day of your Standard trial — Upgrade to unlock automatic plans"
    : `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left in your Standard trial`;

  const mainMessage = isDay12
    ? "You have 2 days left in your Standard trial of NextBestMove. You're building momentum — keep it going."
    : isDay14
    ? "Today is the last day of your Standard trial. Upgrade to Standard to keep automatic daily plans, calendar-aware capacity, and AI-assisted weekly summaries."
    : `You have ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left in your Standard trial of NextBestMove.`;

  const secondaryMessage = isDay12
    ? "Upgrade to Standard to keep automatic daily plans, calendar-aware capacity, and AI-assisted weekly summaries. If you don't upgrade, you'll automatically continue on the Free tier with manual planning and basic features."
    : isDay14
    ? "After today, you'll be on Free - Memory Relief. You can still use manual planning and basic features, but automatic daily plans and calendar-aware capacity require Standard - Decision Automation."
    : "Upgrade to Standard to unlock automatic daily plans and keep your rhythm going.";

  const content = `
    <p style="margin-bottom: 16px;">
      ${mainMessage}
    </p>
    <p style="margin-bottom: 16px;">
      ${secondaryMessage}
    </p>
  `;

  const html = createEmailTemplate({
    greeting: `Hi ${userName || "there"},`,
    content,
    cta: {
      text: "Upgrade to Standard",
      url: `${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.app"}/app/settings`,
    },
    footer: isDay14
      ? "Your data is safe and nothing is lost. You'll have access to Free tier features, and can upgrade to Standard anytime to unlock automatic plans."
      : "Your data is safe and nothing is lost. You can upgrade to Standard anytime to unlock automatic plans.",
  });

  return sendEmail({ to, subject, html });
}

/**
 * Email template for payment failure
 */
export async function sendPaymentFailureEmail({
  to,
  userName,
  daysSinceFailure,
}: {
  to: string;
  userName: string;
  daysSinceFailure: number;
}) {
  let subject: string;
  let message: string;
  let footerMessage: string;

  if (daysSinceFailure === 0) {
    subject = "Your payment failed — Account moved to Free tier";
    message = "Your payment failed, so we've moved your account to the Free tier. Update your payment method to restore your Standard/Premium access and automatic daily plans.";
    footerMessage = "Your data is safe. Once you update your payment method, you'll immediately regain full access to your previous plan.";
  } else if (daysSinceFailure === 3) {
    subject = "Reminder: Update your payment method to restore access";
    message = "Your payment failed 3 days ago. Your account is currently on the Free tier with manual planning only. Update your payment method to restore automatic daily plans and full access.";
    footerMessage = "Your data is safe. Update your payment method to immediately restore your previous plan features.";
  } else if (daysSinceFailure === 7) {
    subject = "Final reminder: Update your payment method";
    message = "Your payment failed 7 days ago. You're currently on the Free tier. Update your payment method to restore automatic daily plans and full access.";
    footerMessage = "Your data is safe. You can continue using Free tier features, or update your payment method to restore your previous plan.";
  } else {
    // Fallback for any other days (shouldn't happen, but keeping for safety)
    subject = "Update your payment method";
    message = "Your payment failed. Update your payment method to restore full access.";
    footerMessage = "Your data is safe. Update your payment method to restore full access.";
  }

  const html = createEmailTemplate({
    greeting: `Hi ${userName || "there"},`,
    content: `<p style="margin-bottom: 16px;">${message}</p>`,
    cta: {
      text: "Update Payment Method",
      url: `${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.app"}/app/settings`,
    },
    footer: footerMessage,
  });

  return sendEmail({ to, subject, html });
}

/**
 * Email template for streak break recovery
 */
export async function sendStreakBreakEmail({
  to,
  userName,
}: {
  to: string;
  userName: string;
}) {
  const subject = "Everything okay?";
  const html = createEmailTemplate({
    greeting: `Hi ${userName || "there"},`,
    content: `
      <p style="margin-bottom: 16px;">
        I noticed you haven't completed any actions in the last 3 days. Everything okay?
      </p>
      <p style="margin-bottom: 16px;">
        Reply and tell me what broke — I read every message.
      </p>
    `,
    cta: {
      text: "Get Back on Track",
      url: `${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.app"}/app/plan`,
    },
    footer: "Your Fast Win is waiting. Takes 3 minutes.",
  });

  return sendEmail({ to, subject, html });
}

/**
 * Email template for win-back campaign
 */
export async function sendWinBackEmail({
  to,
  userName,
  daysSinceCancellation,
}: {
  to: string;
  userName: string;
  daysSinceCancellation: number;
}) {
  let subject: string;
  let message: string;
  let ctaText: string;

  let ctaUrl: string;
  
  if (daysSinceCancellation === 7) {
    subject = "What didn't work for you?";
    message = "We'd love to hear what didn't work for you. Your feedback helps us improve.";
    ctaText = "Share Feedback";
    ctaUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.app"}/app/feedback`;
  } else if (daysSinceCancellation === 30) {
    subject = "We shipped updates since you left";
    message = "We've made improvements based on feedback. One of them might solve the issue you mentioned.";
    ctaText = "See What's New";
    ctaUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.app"}/app/settings`;
  } else if (daysSinceCancellation === 90) {
    subject = "Your past data is still here";
    message = "Your past data is still here. Reactivate in one click and pick up where you left off.";
    ctaText = "Reactivate";
    ctaUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.app"}/app/settings`;
  } else {
    subject = "Should we delete your data or keep it?";
    message = "It's been 180 days since you canceled. Should we delete your data or keep it for a bit longer?";
    ctaText = "Manage Data";
    ctaUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.app"}/app/settings`;
  }

  const html = createEmailTemplate({
    greeting: `Hi ${userName || "there"},`,
    content: `<p style="margin-bottom: 16px;">${message}</p>`,
    cta: {
      text: ctaText,
      url: ctaUrl,
    },
    footer: daysSinceCancellation === 7 ? "We read every message." : "No commitment. Just checking in.",
  });

  return sendEmail({ to, subject, html });
}

/**
 * Email template for password reset
 */
export async function sendPasswordResetEmail({
  to,
  userName,
  resetLink,
}: {
  to: string;
  userName: string;
  resetLink: string;
}) {
  const subject = "Reset your NextBestMove password";
  const html = createEmailTemplate({
    greeting: `Hi ${userName || "there"},`,
    content: `
      <p style="margin-bottom: 16px;">
        We received a request to reset your password. Click the button below to set a new password:
      </p>
    `,
    cta: {
      text: "Reset Password",
      url: resetLink,
    },
    footer: `This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.<br><br>If the button doesn't work, copy and paste this link into your browser:<br><a href="${resetLink}" style="color: #2563EB; word-break: break-all;">${resetLink}</a>`,
  });

  return sendEmail({ to, subject, html });
}

/**
 * Email template for account activation/confirmation
 */
export async function sendAccountActivationEmail({
  to,
  userName,
  activationLink,
}: {
  to: string;
  userName: string;
  activationLink: string;
}) {
  const subject = "Confirm your NextBestMove account";
  const html = createEmailTemplate({
    greeting: `Welcome to NextBestMove, ${userName || "there"}!`,
    content: `
      <p style="margin-bottom: 16px;">
        Thanks for signing up! Please confirm your email address to get started:
      </p>
    `,
    cta: {
      text: "Confirm Email Address",
      url: activationLink,
    },
    footer: `This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.<br><br>If the button doesn't work, copy and paste this link into your browser:<br><a href="${activationLink}" style="color: #2563EB; word-break: break-all;">${activationLink}</a>`,
  });

  return sendEmail({ to, subject, html });
}

/**
 * Email template for welcome email (sent after successful sign-up when confirmations are disabled)
 */
export async function sendWelcomeEmail({
  to,
  userName,
}: {
  to: string;
  userName: string;
}) {
  const subject = "Welcome to NextBestMove!";
  const html = createEmailTemplate({
    greeting: `Welcome to NextBestMove, ${userName || "there"}!`,
    content: `
      <p style="margin-bottom: 16px;">
        Thanks for signing up! We're excited to help you build better relationships and stay on top of your follow-ups.
      </p>
      <p style="margin-bottom: 16px;">
        Get started by completing your onboarding to set up your first daily plan.
      </p>
    `,
    cta: {
      text: "Complete Onboarding",
      url: `${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.app"}/onboarding`,
    },
    footer: "If you have any questions, just reply to this email. We're here to help!",
  });

  return sendEmail({ to, subject, html });
}

/**
 * Email template for streak recovery (Day 3 after streak break)
 */
export async function sendStreakRecoveryEmail(
  to: string,
  userName: string
) {
  const subject = "Let's get your streak back on track";
  const html = createEmailTemplate({
    greeting: `Hey ${userName || "there"},`,
    content: `
      <p style="margin-bottom: 16px;">
        We noticed you haven't been active for a few days. No worries — life happens!
      </p>
      <p style="margin-bottom: 16px;">
        The good news? Your streak might be paused, but your momentum can start right back up with just one small action today.
      </p>
      <p style="margin-bottom: 16px;">
        We've set up a lighter plan for you today — just 1-2 high-impact actions to help you ease back in. Think of it as your comeback plan.
      </p>
      <p style="margin-bottom: 16px;">
        Remember: consistency beats perfection. One action today is better than zero.
      </p>
    `,
    cta: {
      text: "View Your Comeback Plan",
      url: `${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.app"}/app/plan`,
    },
    footer: "You've got this! 💪",
  });

  return sendEmail({ to, subject, html });
}

/**
 * Email template for Day 7 inactivity acknowledgment (after 7 days of inactivity)
 * Note: Billing pause feature was removed - this email just acknowledges inactivity
 */
export async function sendBillingPauseOfferEmail({
  to,
  userName,
}: {
  to: string;
  userName: string;
}) {
  const subject = "We noticed you haven't been active";
  const html = createEmailTemplate({
    greeting: `Hi ${userName || "there"},`,
    content: `
      <p style="margin-bottom: 16px;">
        We noticed you haven't been active for a week. Life gets busy — we get it.
      </p>
      <p style="margin-bottom: 16px;">
        Your account is still active and your data is safe. When you're ready to come back, just log in and pick up where you left off.
      </p>
    `,
    cta: {
      text: "View Your Plan",
      url: `${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.app"}/app/plan`,
    },
    footer: "If you have any questions or need help, just reply to this email.",
  });

  return sendEmail({ to, subject, html });
}


