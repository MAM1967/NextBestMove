# Enable Email Confirmations with Resend

## Current Status

Email confirmations are currently **disabled** in the local config (`supabase/config.toml`). This was likely set for easier local development/testing. However, **production settings are managed separately in the Supabase Dashboard**, not in the config file.

## Why Enable Email Confirmations?

- **Security**: Prevents fake/spam accounts
- **Data Quality**: Ensures users have valid email addresses
- **Deliverability**: Better email reputation when using verified emails
- **Compliance**: Some regulations require email verification

## Steps to Enable Email Confirmations

### 1. Enable in Supabase Dashboard (Production)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **Authentication** → **Providers**
3. Click on **Email** provider
4. Find the **"Confirm email"** toggle
5. **Enable** the toggle
6. Click **Save**

### 2. Configure Resend as SMTP Provider

Since you're on a paid Resend plan, configure Supabase to use Resend for sending emails:

1. In Supabase Dashboard, go to **Authentication** (left sidebar)
2. Click on **Notifications** → **Email** (NOT "Sign In / Providers")
3. You should see **SMTP Settings** section
4. Enable **Custom SMTP** toggle
5. Enter Resend SMTP credentials:
   - **Host**: `smtp.resend.com`
   - **Port**: `465` (SSL) or `587` (TLS)
   - **Username**: `resend`
   - **Password**: Your Resend API key (starts with `re_`)
   - **Sender email**: `noreply@nextbestmove.app` (or your verified domain)
   - **Sender name**: `NextBestMove`
6. Click **Save**

**Navigation Path**: Authentication → Notifications → Email → SMTP Settings

**Note**: Make sure your domain (`nextbestmove.app`) is verified in Resend before using it as the sender email.

### 3. Update Local Config (Optional)

For local development, you can enable confirmations in `supabase/config.toml`:

```toml
[auth.email]
enable_confirmations = true
```

However, local emails will still go to Inbucket (email testing server), not Resend.

### 4. Update Code to Handle Email Confirmations

The code has already been updated to:

- Send activation emails via Resend when confirmations are enabled
- Send welcome emails when confirmations are disabled
- Handle both scenarios automatically

## Testing

### Local Testing

1. Start Supabase locally: `supabase start`
2. Check Inbucket at `http://localhost:54324` to see emails
3. Test sign-up flow - should receive activation email

### Production Testing

1. Sign up with a test email
2. Check email inbox (and spam folder)
3. Click activation link
4. Verify you can sign in after activation

## What Happens When Enabled

**Before (Confirmations Disabled):**

- User signs up → Account created immediately → Can sign in right away
- Welcome email sent via Resend

**After (Confirmations Enabled):**

- User signs up → Account created but unconfirmed → Cannot sign in yet
- Activation email sent via Resend with confirmation link
- User clicks link → Email confirmed → Can now sign in

## Redirect URLs

Make sure these URLs are added to **Authentication** → **URL Configuration** → **Redirect URLs** in Supabase Dashboard:

- `https://nextbestmove.app/auth/reset-password` (for password reset)
- `https://nextbestmove.app/auth/sign-in` (for email confirmation)
- `http://localhost:3000/auth/reset-password` (for local dev)
- `http://localhost:3000/auth/sign-in` (for local dev)

## Troubleshooting

### Emails Not Sending

1. Check Resend dashboard for delivery status
2. Verify Resend API key is correct in Supabase SMTP settings
3. Check domain verification in Resend
4. Review Supabase logs for email sending errors

### Activation Links Not Working

1. Verify redirect URLs are configured in Supabase
2. Check that the link format matches: `https://nextbestmove.app/auth/sign-in?token=...`
3. Ensure token hasn't expired (default: 1 hour)

### Users Can't Sign In After Sign-Up

1. Check if email confirmations are enabled
2. Verify user received and clicked activation email
3. Check `auth.users.email_confirmed_at` in Supabase to see if email is confirmed

---

**Last Updated**: January 29, 2025
