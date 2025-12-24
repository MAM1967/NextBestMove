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
    ? "Upgrade to Standard - Decision Automation to unlock automatic daily plans, calendar-aware capacity, and AI-assisted weekly summaries. No commitment required."
    : isDay14
    ? "After today, you'll be on Free - Memory Relief. You can still use manual planning and basic features, but automatic daily plans and calendar-aware capacity require Standard - Decision Automation."
    : "Upgrade to Standard to unlock automatic daily plans and keep your rhythm going.";

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
          ${mainMessage}
        </p>
        
        <p style="margin-bottom: 16px;">
          ${secondaryMessage}
        </p>
        
        <div style="margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.app"}/app/settings" 
             style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            ${isDay14 ? "Upgrade to Standard" : "Upgrade to Standard"}
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
          ${isDay14 
            ? "Your data is safe and nothing is lost. You'll have access to Free tier features, and can upgrade to Standard anytime to unlock automatic plans." 
            : "Your data is safe and nothing is lost. Upgrade to Standard to unlock automatic daily plans and keep your rhythm going."}
        </p>
      </body>
    </html>
  `;

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

  if (daysSinceFailure === 0) {
    subject = "Your payment failed — Update to keep your rhythm";
    message = "Your payment failed. Update your payment method to keep your rhythm going.";
  } else if (daysSinceFailure === 3) {
    subject = "Reminder: Update your payment method";
    message = "Your payment failed 3 days ago. Update your payment method to restore access.";
  } else if (daysSinceFailure === 7) {
    subject = "Your account is now read-only";
    message = "Your account has been moved to read-only mode. Update your payment method to reactivate.";
  } else {
    subject = "Final notice: Update your payment method";
    message = "Your account will be archived soon. Update your payment method to keep your data.";
  }

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
          ${message}
        </p>
        
        <div style="margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.app"}/app/settings" 
             style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Update Payment Method
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
          Your data is safe. Update your payment method to restore full access.
        </p>
      </body>
    </html>
  `;

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
          I noticed you haven't completed any actions in the last 3 days. Everything okay?
        </p>
        
        <p style="margin-bottom: 16px;">
          Reply and tell me what broke — I read every message.
        </p>
        
        <div style="margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.app"}/app/plan" 
             style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Get Back on Track
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
          Your Fast Win is waiting. Takes 3 minutes.
        </p>
      </body>
    </html>
  `;

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
          ${message}
        </p>
        
        <div style="margin: 32px 0;">
          <a href="${ctaUrl}" 
             style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            ${ctaText}
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
          ${daysSinceCancellation === 7 ? "We read every message." : "No commitment. Just checking in."}
        </p>
      </body>
    </html>
  `;

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
          We received a request to reset your password. Click the button below to set a new password:
        </p>
        
        <div style="margin: 32px 0;">
          <a href="${resetLink}" 
             style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
          This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 16px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetLink}" style="color: #6366f1; word-break: break-all;">${resetLink}</a>
        </p>
      </body>
    </html>
  `;

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
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #111827; font-size: 24px; margin-bottom: 16px;">Welcome to NextBestMove, ${userName || "there"}!</h1>
        
        <p style="margin-bottom: 16px;">
          Thanks for signing up! Please confirm your email address to get started:
        </p>
        
        <div style="margin: 32px 0;">
          <a href="${activationLink}" 
             style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Confirm Email Address
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
          This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 16px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${activationLink}" style="color: #6366f1; word-break: break-all;">${activationLink}</a>
        </p>
      </body>
    </html>
  `;

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
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #111827; font-size: 24px; margin-bottom: 16px;">Welcome to NextBestMove, ${userName || "there"}!</h1>
        
        <p style="margin-bottom: 16px;">
          Thanks for signing up! We're excited to help you build better relationships and stay on top of your follow-ups.
        </p>
        
        <p style="margin-bottom: 16px;">
          Get started by completing your onboarding to set up your first daily plan.
        </p>
        
        <div style="margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.app"}/onboarding" 
             style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Complete Onboarding
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
          If you have any questions, just reply to this email. We're here to help!
        </p>
      </body>
    </html>
  `;

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
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #111827; font-size: 24px; margin-bottom: 16px;">Hey ${userName || "there"},</h1>
        
        <p style="margin-bottom: 16px;">
          We noticed you haven't been active for a few days. No worries — life happens!
        </p>
        
        <p style="margin-bottom: 16px;">
          The good news? Your streak might be paused, but your momentum can start right back up with just one small action today.
        </p>
        
        <p style="margin-bottom: 16px;">
          We've set up a lighter plan for you today — just 1-2 high-impact actions to help you ease back in. Think of it as your comeback plan.
        </p>
        
        <div style="margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.app"}/app/plan" 
             style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            View Your Comeback Plan
          </a>
        </div>
        
        <p style="margin-bottom: 16px;">
          Remember: consistency beats perfection. One action today is better than zero.
        </p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
          You've got this! 💪
        </p>
      </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

/**
 * Email template for Day 7 billing pause offer (after 7 days of inactivity)
 */
export async function sendBillingPauseOfferEmail({
  to,
  userName,
}: {
  to: string;
  userName: string;
}) {
  const subject = "Pause your subscription while you're away";
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
          We noticed you haven't been active for a week. Life gets busy — we get it.
        </p>
        
        <p style="margin-bottom: 16px;">
          If you're taking a break, we can pause your subscription for up to 30 days. You won't be charged during the pause, and you can reactivate anytime.
        </p>
        
        <p style="margin-bottom: 16px;">
          Your data stays safe and nothing is lost. When you're ready to come back, just reactivate and pick up where you left off.
        </p>
        
        <div style="margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.app"}/app/settings" 
             style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Pause Subscription
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
          Or just ignore this email if you plan to be back soon. We'll keep your account active.
        </p>
      </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}


