import { Resend } from "resend";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Default from address (update when domain is verified)
const DEFAULT_FROM = "NextBestMove <onboarding@resend.dev>";

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
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Resend email error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

/**
 * Email template for trial reminders
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
  const subject =
    daysRemaining === 2
      ? "2 days left in your trial"
      : "Last day of trial — Subscribe to keep your rhythm";

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
          ${daysRemaining === 2 ? "You have 2 days left" : "Today is the last day"} in your free trial of NextBestMove.
        </p>
        
        <p style="margin-bottom: 16px;">
          You'll know in 48 hours if this works. No commitment required.
        </p>
        
        <div style="margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.com"}/app/settings" 
             style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Subscribe Now
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
          Your data is safe and nothing is lost. Subscribe to resume your rhythm.
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
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.com"}/app/settings" 
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
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.com"}/app/plan" 
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

  if (daysSinceCancellation === 7) {
    subject = "What didn't work for you?";
    message = "We'd love to hear what didn't work for you. Your feedback helps us improve.";
    ctaText = "Share Feedback";
  } else if (daysSinceCancellation === 30) {
    subject = "We shipped updates since you left";
    message = "We've made improvements based on feedback. One of them might solve the issue you mentioned.";
    ctaText = "See What's New";
  } else if (daysSinceCancellation === 90) {
    subject = "Your past data is still here";
    message = "Your past data is still here. Reactivate in one click and pick up where you left off.";
    ctaText = "Reactivate";
  } else {
    subject = "Should we delete your data or keep it?";
    message = "It's been 180 days since you canceled. Should we delete your data or keep it for a bit longer?";
    ctaText = "Manage Data";
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
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.com"}/app/settings" 
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

