import { sendEmail, createEmailTemplate } from "./resend";

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

  const content = `
    <p style="margin-bottom: 16px;">
      Thanks for signing up for early access to NextBestMove!
    </p>
    <p style="margin-bottom: 16px;">
      We'll reach out personally with access details and a short onboarding.
    </p>
    <p style="margin-top: 24px; margin-bottom: 0;">
      Best,<br>
      <strong>The NextBestMove Team</strong>
    </p>
  `;

  const html = createEmailTemplate({
    greeting: `Hi ${name},`,
    content,
    cta: null,
    footer: "MAM Growth Strategies LLC",
  });

  return sendEmail({ to, subject, html });
}

