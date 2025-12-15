# Disable Supabase Default Emails

## Problem

When users sign up, they receive emails from "Supabase Auth" instead of from Resend with NextBestMove branding.

## Solution

Disable email confirmations in Supabase Dashboard to prevent Supabase from sending its default emails.

## Steps

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** > **Settings**
4. Under **Email Auth**, find **"Enable email confirmations"**
5. **Disable** this setting (toggle it off)
6. Save changes

## Why This Is Needed

- Supabase automatically sends confirmation emails when email confirmations are enabled
- This happens before our Resend email code runs
- Disabling email confirmations allows us to use only Resend emails with proper branding
- Our code already handles account activation via Resend emails

## After Disabling

- Users will only receive Resend emails (with NextBestMove branding)
- Account activation will work via Resend email links
- No more "Supabase Auth" emails will be sent

## Note

This setting needs to be disabled in:
- ✅ Staging Supabase project
- ✅ Production Supabase project
- Local development uses `enable_confirmations = false` in `supabase/config.toml` (already configured)

---

**Last Updated:** January 2025

