import { sendEmail } from "./resend";

interface EarlyAccessConfirmationEmailParams {
  to: string;
  name: string;
}

/**
 * Send early access confirmation email
 */
export async function sendEarlyAccessConfirmationEmail({
  to,
  name,
}: EarlyAccessConfirmationEmailParams) {
  const subject = "Thanks for your interest in NextBestMove";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thanks for your interest</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #18181B; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #FAFAF9; padding: 40px 20px; border-radius: 8px;">
          <h1 style="color: #18181B; font-size: 24px; font-weight: 600; margin: 0 0 16px 0;">
            Hi ${name},
          </h1>
          
          <p style="color: #52525B; font-size: 16px; margin: 0 0 16px 0;">
            Thanks for signing up for early access to NextBestMove!
          </p>
          
          <p style="color: #52525B; font-size: 16px; margin: 0 0 16px 0;">
            We'll reach out personally with access details and a short onboarding.
          </p>
          
          <p style="color: #52525B; font-size: 16px; margin: 24px 0 0 0;">
            Best,<br>
            <strong>The NextBestMove Team</strong>
          </p>
        </div>
        
        <p style="color: #71717A; font-size: 12px; text-align: center; margin-top: 24px;">
          MAM Growth Strategies LLC
        </p>
      </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

