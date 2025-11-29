# Verify Email is Working After Deploy

## Step 1: Check Environment Variables

Visit this URL after deployment completes:
```
https://nextbestmove.app/api/check-env
```

You should see:
```json
{
  "variables": {
    "RESEND_API_KEY": {
      "set": true,
      "length": 51,
      "startsWith": "re_"
    }
  }
}
```

If `"set": false`, the key is still not available. Wait a few minutes for the deployment to fully complete, then check again.

## Step 2: Test Password Reset Email

1. Go to: `https://nextbestmove.app/auth/forgot-password`
2. Enter your email address
3. Click "Send reset link"
4. You should see: "If an account exists with this email, you'll receive a password reset link shortly."

## Step 3: Check Vercel Logs

1. Go to **Vercel Dashboard** → Your Project → **Deployments**
2. Click on the latest deployment
3. Go to **Functions** tab
4. Look for logs with:
   - `📧 Attempting to send email via Resend:` - Email send attempt
   - `✅ Email sent successfully via Resend:` - Email was accepted by Resend (includes email ID)
   - `❌ Resend email error:` - Error from Resend API

## Step 4: Check Resend Dashboard

1. Go to https://resend.com/emails
2. Check the "Emails" section for recent sends
3. You should see the password reset email listed

## Step 5: Check Your Inbox

- Check your inbox (and spam folder)
- The email should arrive within a few seconds

## If It's Still Not Working

If the diagnostic endpoint shows the key is set but emails still aren't sending:

1. **Check Resend Dashboard** for specific error messages
2. **Verify domain** `nextbestmove.app` is verified in Resend
3. **Check API key permissions** in Resend dashboard
4. **Review Vercel logs** for the exact error message

---

_Last updated: January 29, 2025_

