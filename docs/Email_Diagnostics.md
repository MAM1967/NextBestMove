# Email Sending Diagnostics

## How to Check if Emails Are Being Sent

### 1. Check Vercel Logs

After requesting a password reset or signing up, check your Vercel deployment logs:

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Go to "Functions" tab
4. Look for logs with these prefixes:
   - `📧 Attempting to send email via Resend:` - Email send attempt
   - `✅ Email sent successfully via Resend:` - Email was accepted by Resend
   - `❌ Resend email error:` - Error from Resend API
   - `❌ Failed to send password reset email:` - Error in our code

### 2. Check Resend Dashboard

1. Go to https://resend.com/emails
2. Check the "Emails" section
3. Look for recent emails sent to your test address
4. Check the status:
   - **Sent** - Email was accepted by Resend
   - **Delivered** - Email reached recipient's server
   - **Bounced** - Email was rejected
   - **Failed** - Error sending email

### 3. Test Email Endpoint

Use the test endpoint to verify email sending:

```bash
# Local testing
curl -X POST "http://localhost:3000/api/test-email?to=your-email@example.com"

# Production testing
curl -X POST "https://nextbestmove.app/api/test-email?to=your-email@example.com"
```

This will send a test password reset email and return the email ID from Resend.

### 4. Common Issues

#### Emails Not Appearing in Resend Dashboard

**Possible causes:**

- Resend API key is incorrect or missing
- API key doesn't have permission to send emails
- Domain not verified in Resend

**Check:**

1. Verify `RESEND_API_KEY` is set in Vercel environment variables
2. Check Resend dashboard → API Keys to verify the key is active
3. Verify domain `nextbestmove.app` is verified in Resend

#### Emails in Resend Dashboard but Not Received

**Possible causes:**

- Email is in spam folder
- Recipient's email server is blocking emails
- Domain reputation issues

**Check:**

1. Check spam/junk folder
2. Check Resend dashboard for bounce/failure status
3. Verify DMARC/SPF/DKIM records are correct
4. Check Resend delivery logs for specific errors

#### Error: "RESEND_API_KEY is not set"

**Fix:**

1. Add `RESEND_API_KEY` to Vercel environment variables
2. Redeploy the application
3. Verify the key is correct (starts with `re_`)

#### Error: "Failed to send email: [error message]"

**Common errors:**

- `Invalid API key` - API key is wrong or expired
- `Domain not verified` - Domain needs to be verified in Resend
- `Rate limit exceeded` - Too many emails sent too quickly
- `Invalid from address` - From address must use verified domain

**Fix:**

1. Check Resend dashboard for specific error details
2. Verify domain is verified
3. Check API key permissions
4. Review rate limits

## Debugging Steps

1. **Request a password reset** on the production site
2. **Check Vercel logs** for email send attempts
3. **Check Resend dashboard** for email status
4. **If email appears in Resend but not inbox:**
   - Check spam folder
   - Verify domain reputation
   - Check DMARC/SPF records
5. **If email doesn't appear in Resend:**
   - Check API key configuration
   - Verify environment variables
   - Check error logs in Vercel

## Log Format

When emails are sent, you'll see logs like:

```
📧 Attempting to send email via Resend: { to: 'user@example.com', from: '...', subject: '...' }
✅ Email sent successfully via Resend: { emailId: 'abc123', to: 'user@example.com', ... }
```

If there's an error:

```
❌ Resend email error: { message: '...', name: '...', error: {...} }
❌ Failed to send password reset email via Resend: { error: '...', email: '...', stack: '...' }
```

## Resend API Response

When an email is successfully sent, Resend returns:

- `id` - Email ID (can be used to track delivery)
- `from` - Sender email
- `to` - Recipient email
- `created_at` - Timestamp

This ID can be used in Resend dashboard to check delivery status.

---

_Last updated: January 29, 2025_
