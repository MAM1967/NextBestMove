# Production Deployment Checklist

**Date:** January 29, 2025  
**Status:** Ready for Production Deployment

---

## Pre-Deployment Checklist

### ✅ Completed Features

- [x] **Account Management**
  - [x] Sign up / Sign in
  - [x] Password change
  - [x] Timezone editing
  - [x] Account deletion (with auth.users deletion)

- [x] **Billing & Subscriptions**
  - [x] Stripe checkout integration
  - [x] Stripe webhook handling
  - [x] Subscription sync
  - [x] Billing portal access
  - [x] 14-day free trial support

- [x] **Calendar Integration**
  - [x] Google Calendar OAuth
  - [x] Outlook Calendar OAuth
  - [x] Free/busy data fetching
  - [x] Calendar status display
  - [x] Weekend preference toggle

- [x] **Core Features**
  - [x] Pin management
  - [x] Action engine
  - [x] Daily plan generation
  - [x] Weekly summary page
  - [x] Content prompt generation (with BYOK support)
  - [x] Data export

- [x] **Settings & Preferences**
  - [x] Email preferences
  - [x] BYOK (Bring Your Own Key) for premium users
  - [x] Account overview

---

## Required Environment Variables

### Vercel Environment Variables

All of these must be set in **Vercel Dashboard → Project Settings → Environment Variables**:

#### Supabase (Required)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (JWT format, starts with `eyJ`)

#### Stripe (Required for Billing)
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key (starts with `sk_live_` for production)
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (for webhook verification)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (starts with `pk_live_` for production)

#### OpenAI (Required for AI Features)
- [ ] `OPENAI_API_KEY` - OpenAI API key (starts with `sk-proj-` or `sk-`)
  - Used for: Content prompt generation, weekly summaries
  - Fallback: Users can use BYOK if premium

#### OAuth (Required for Calendar Integration)
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth client ID
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- [ ] `MICROSOFT_CLIENT_ID` - Microsoft/Azure AD client ID
- [ ] `MICROSOFT_CLIENT_SECRET` - Microsoft/Azure AD client secret
- [ ] `MICROSOFT_TENANT_ID` - Microsoft tenant ID (usually `common`)

#### NextAuth (If using NextAuth.js)
- [ ] `NEXTAUTH_URL` - Production domain: `https://nextbestmove.app`
- [ ] `NEXTAUTH_SECRET` - Secret for NextAuth (generate with: `openssl rand -base64 32`)

#### Resend (For Email - Optional)
- [ ] `RESEND_API_KEY` - Resend API key for transactional emails (if using Resend)

#### Encryption (For BYOK)
- [ ] `ENCRYPTION_KEY` - 32-character encryption key (or will use service role key prefix)

---

## Domain Configuration

### DNS Setup
- [ ] Domain DNS records configured
- [ ] Domain added to Vercel project
- [ ] SSL certificate provisioned (automatic with Vercel)

### Supabase Configuration
- [ ] Update Supabase Auth redirect URLs to include production domain
  - Go to: Supabase Dashboard → Authentication → URL Configuration
  - **Site URL:** `https://nextbestmove.app`
  - **Redirect URLs:** Add the following:
    - `https://nextbestmove.app/auth/callback`
    - `https://nextbestmove.app/api/auth/callback/*`
    - `https://nextbestmove.app/api/calendar/callback/google`
    - `https://nextbestmove.app/api/calendar/callback/outlook`

### OAuth Provider Configuration
- [ ] **Google OAuth:**
  - [ ] Go to: [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
  - [ ] Edit your OAuth 2.0 Client ID
  - [ ] **Authorized JavaScript origins:** Add `https://nextbestmove.app`
  - [ ] **Authorized redirect URIs:** Add `https://nextbestmove.app/api/calendar/callback/google`
  - [ ] Save changes

- [ ] **Microsoft OAuth:**
  - [ ] Go to: [Azure Portal](https://portal.azure.com/) → Azure Active Directory → App registrations
  - [ ] Select your app registration
  - [ ] Go to Authentication → Add a platform → Web
  - [ ] **Redirect URI:** Add `https://nextbestmove.app/api/calendar/callback/outlook`
  - [ ] Save changes

---

## Database Migrations

- [ ] All migrations applied to production Supabase database
- [ ] Verify RLS policies are enabled
- [ ] Test that users can only access their own data

**To apply migrations:**
```bash
# Option 1: Via Supabase Dashboard SQL Editor
# Copy and paste each migration file from supabase/migrations/

# Option 2: Via Supabase CLI (if configured)
supabase db push
```

---

## Stripe Configuration

### Production Stripe Account
- [ ] Stripe account activated for live mode
- [ ] Production API keys generated
- [ ] Webhook endpoint configured:
  - URL: `https://nextbestmove.app/api/billing/webhook`
  - Events to listen for:
    - `checkout.session.completed`
    - `customer.subscription.created`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.payment_failed`
    - `customer.subscription.trial_will_end`

### Stripe Products & Prices
- [ ] Create production products in Stripe Dashboard:
  - Standard Plan (monthly & annual)
  - Premium/Professional Plan (monthly & annual)
- [ ] Note the `price_id` values for each plan
- [ ] Update code if price IDs are different from test mode

---

## Pre-Launch Testing

### Critical Paths to Test
- [ ] **Sign Up Flow**
  - [ ] New user can create account
  - [ ] User profile created in database
  - [ ] Redirects to app after sign-up

- [ ] **Sign In Flow**
  - [ ] Existing user can sign in
  - [ ] Session persists across page refreshes

- [ ] **Billing Flow**
  - [ ] "Start Free Trial" button works
  - [ ] Stripe checkout redirects correctly
  - [ ] Webhook receives events and updates database
  - [ ] User can access premium features after subscription
  - [ ] Billing portal access works

- [ ] **Calendar Integration**
  - [ ] Google Calendar OAuth flow works
  - [ ] Outlook Calendar OAuth flow works
  - [ ] Calendar events are fetched correctly
  - [ ] Free/busy data is calculated correctly

- [ ] **Account Deletion**
  - [ ] User can delete account
  - [ ] All data is deleted
  - [ ] User cannot sign back in after deletion

- [ ] **Settings**
  - [ ] Password change works
  - [ ] Timezone update works
  - [ ] Email preferences save correctly
  - [ ] BYOK setup works (for premium users)

---

## Security Checklist

- [ ] All environment variables are set (no fallback values in production)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is NOT exposed to client-side
- [ ] Stripe webhook secret is configured and verified
- [ ] RLS policies are enabled on all tables
- [ ] CORS is configured correctly (if needed)
- [ ] Rate limiting considered for API routes

---

## Monitoring & Observability

### Recommended Setup (P2 - Can be added post-launch)
- [ ] Sentry error tracking
- [ ] Analytics (PostHog/Mixpanel)
- [ ] Vercel Analytics
- [ ] Logging for critical operations

---

## Post-Deployment

### Immediate Checks
- [ ] Production site loads correctly
- [ ] Sign up works
- [ ] Sign in works
- [ ] No console errors in browser
- [ ] No errors in Vercel function logs

### First Week Monitoring
- [ ] Monitor Vercel function logs for errors
- [ ] Check Stripe webhook delivery
- [ ] Verify calendar OAuth flows
- [ ] Monitor account creation/deletion

---

## Known Issues / Limitations

### P1 Items Not Yet Implemented
- [ ] Password reset / Forgot password flow
- [ ] Customizable working hours (onboarding preference)
- [ ] Weekly summary metrics job (background cron)
- [ ] Background jobs (daily plan cron, auto-unsnooze, etc.)

### Can Launch Without
- Onboarding flow (8 steps) - users can use app without it
- Notification preferences wiring - toggles exist but not wired
- Observability setup - can add post-launch

---

## Deployment Steps

1. **Set all environment variables in Vercel**
2. **Apply database migrations to production Supabase**
3. **Configure OAuth redirect URIs in Google/Microsoft**
4. **Update Supabase Auth redirect URLs**
5. **Configure Stripe webhook endpoint**
6. **Add domain to Vercel project**
7. **Deploy to production**
8. **Run critical path tests**
9. **Monitor for first 24 hours**

---

## Rollback Plan

If issues are discovered:
1. Revert to previous Vercel deployment
2. Check Vercel function logs for errors
3. Verify environment variables are correct
4. Check Supabase logs for database errors
5. Verify Stripe webhook is receiving events

---

_Last updated: January 29, 2025_

