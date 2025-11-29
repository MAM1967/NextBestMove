# Production Domain Configuration Guide
## nextbestmove.app

**Date:** January 29, 2025  
**Domain:** `nextbestmove.app`

---

## Quick Configuration Checklist

### 1. Vercel Domain Setup
- [ ] Add domain `nextbestmove.app` to Vercel project
- [ ] Configure DNS records (Vercel will provide instructions)
- [ ] SSL certificate will be automatically provisioned

### 2. Environment Variables in Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Set these for **Production** environment:

```
NEXT_PUBLIC_SUPABASE_URL=https://lilhqhbbougkblznspow.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (JWT format)

STRIPE_SECRET_KEY=sk_live_... (production key)
STRIPE_WEBHOOK_SECRET=whsec_... (production webhook secret)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (production key)

OPENAI_API_KEY=sk-proj-... (your OpenAI API key)

GOOGLE_CLIENT_ID=... (from Google Cloud Console)
GOOGLE_CLIENT_SECRET=... (from Google Cloud Console)

MICROSOFT_CLIENT_ID=... (from Azure AD)
MICROSOFT_CLIENT_SECRET=... (from Azure AD)
MICROSOFT_TENANT_ID=common (or your tenant ID)

ENCRYPTION_KEY=... (32 characters, or will use service role key prefix)

RESEND_API_KEY=... (if using Resend for emails)
```

---

## 3. Supabase Configuration

### Auth Redirect URLs

1. Go to: **Supabase Dashboard → Authentication → URL Configuration**

2. **Site URL:**
   ```
   https://nextbestmove.app
   ```

3. **Redirect URLs** (add all of these):
   ```
   https://nextbestmove.app/auth/callback
   https://nextbestmove.app/api/auth/callback/*
   https://nextbestmove.app/api/calendar/callback/google
   https://nextbestmove.app/api/calendar/callback/outlook
   ```

4. Save changes

---

## 4. Google OAuth Configuration

1. Go to: **[Google Cloud Console](https://console.cloud.google.com/)**
2. Navigate to: **APIs & Services → Credentials**
3. Find your OAuth 2.0 Client ID (or create one)
4. Click **Edit**

5. **Authorized JavaScript origins:**
   ```
   https://nextbestmove.app
   ```

6. **Authorized redirect URIs:**
   ```
   https://nextbestmove.app/api/calendar/callback/google
   ```

7. **Save**

---

## 5. Microsoft OAuth Configuration

1. Go to: **[Azure Portal](https://portal.azure.com/)**
2. Navigate to: **Azure Active Directory → App registrations**
3. Select your app registration (or create one)
4. Go to: **Authentication**

5. **Add a platform → Web**

6. **Redirect URIs:**
   ```
   https://nextbestmove.app/api/calendar/callback/outlook
   ```

7. **Save**

---

## 6. Stripe Webhook Configuration

### Option A: Test Mode (Recommended for Initial Launch)

**Use test mode if:**
- You're deploying to production but won't have real users immediately
- You want to test the full payment flow without real charges
- You're launching during a holiday period (e.g., Christmas)

**Configuration:**
1. Go to: **[Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)** (test mode)
2. Navigate to: **Developers → Webhooks**
3. Click **Add endpoint** (or edit existing)

4. **Endpoint URL:**
   ```
   https://nextbestmove.app/api/billing/webhook
   ```

5. **Events to listen for:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`

6. **Copy the Signing secret** (starts with `whsec_`)
7. Add to Vercel as `STRIPE_WEBHOOK_SECRET`

**Vercel Environment Variables (Test Mode):**
```
STRIPE_SECRET_KEY=sk_test_... (test mode key)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (test mode key)
STRIPE_WEBHOOK_SECRET=whsec_... (test mode webhook secret)
```

### Option B: Live Mode (When Ready for Real Payments)

**Switch to live mode when:**
- You're ready to accept real payments
- You have real users signing up
- You've tested everything in test mode

**Configuration:**
1. Go to: **[Stripe Dashboard](https://dashboard.stripe.com/webhooks)** (live mode)
2. Follow same steps as test mode
3. Use **live mode** keys instead of test keys

**Vercel Environment Variables (Live Mode):**
```
STRIPE_SECRET_KEY=sk_live_... (live mode key)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (live mode key)
STRIPE_WEBHOOK_SECRET=whsec_... (live mode webhook secret)
```

**Important:** You can have both test and live webhooks configured. Just make sure your environment variables match the mode you want to use.

---

## 7. Database Migrations

Apply all migrations to production Supabase:

1. Go to: **Supabase Dashboard → SQL Editor**
2. Run each migration file from `supabase/migrations/` in order:
   - `202511260001_initial_schema.sql`
   - `202501270002_add_users_insert_policy.sql`
   - `202501280000_add_byok_fields.sql`
   - `202501280002_create_premium_for_user.sql` (if needed)
   - `202501280004_verify_byok_setup.sql` (verification only)
   - `202501280005_check_byok_columns.sql` (verification only)
   - `202501280006_add_email_preferences.sql`
   - `202501280007_add_users_delete_policy.sql`

**Or use Supabase CLI:**
```bash
supabase db push --db-url "your-production-db-url"
```

---

## 8. Vercel Deployment

1. **Connect domain:**
   - Go to: **Vercel Dashboard → Your Project → Settings → Domains**
   - Add: `nextbestmove.app`
   - Follow DNS configuration instructions

2. **Deploy:**
   - Push to `main` branch (auto-deploys)
   - Or manually trigger deployment

3. **Verify:**
   - Visit `https://nextbestmove.app`
   - Test sign up
   - Test sign in
   - Check browser console for errors

---

## Post-Deployment Verification

### Critical Tests

1. **Sign Up:**
   - [ ] Visit `https://nextbestmove.app`
   - [ ] Create new account
   - [ ] Verify redirect works

2. **Calendar OAuth:**
   - [ ] Go to Settings → Calendar
   - [ ] Click "Connect Google Calendar"
   - [ ] Verify OAuth redirect works
   - [ ] Verify calendar connects successfully

3. **Billing:**
   - [ ] Click "Start Free Trial"
   - [ ] Verify Stripe checkout redirects
   - [ ] Complete checkout (test mode)
   - [ ] Verify webhook receives event
   - [ ] Verify subscription status updates

4. **Account Deletion:**
   - [ ] Create test account
   - [ ] Delete account
   - [ ] Verify cannot sign back in

---

## Troubleshooting

### OAuth Redirect Errors
- Verify redirect URIs match exactly (no trailing slashes)
- Check that domain is added in OAuth provider console
- Verify HTTPS is working (SSL certificate valid)

### Stripe Webhook Not Receiving Events
- Verify webhook URL is correct
- Check webhook secret matches in Vercel
- Verify Stripe is in live mode (not test mode)
- Check Vercel function logs for webhook errors

### Environment Variables Not Working
- Verify variables are set for **Production** environment
- Redeploy after adding new variables
- Check Vercel function logs for missing variables

---

_Last updated: January 29, 2025_

