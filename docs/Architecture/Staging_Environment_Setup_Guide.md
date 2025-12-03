# Staging Environment Setup Guide

**For:** nextbestmove.app  
**Repository:** github.com/MAM1967/NextBestMove  
**Status:** 📋 Planning Document (To be implemented after P1 backlog completion)

---

## Overview

This guide explains how to create a secure, isolated staging environment for NextBestMove across:

1. **Vercel** (frontend deployment)
2. **Supabase** (database + auth separation)
3. **Stripe** (test mode separation)
4. **Resend** (email service separation)
5. **GitHub** (branch workflow)
6. **Monitoring** (observability separation)

**The goal:** Staging must never touch production databases, users, payments, secrets, or monitoring data.

---

## 1. GitHub Branch Workflow

### 1.1 Branch Strategy

```
main          → Production (protected, requires PR)
staging       → Staging environment (auto-deploys to staging.nextbestmove.app)
feature/...   → Feature branches (auto-deploy preview URLs)
```

### 1.2 Workflow

**Development:**
1. Create feature branch: `git checkout -b feature/new-feature`
2. Make changes and commit
3. Push to GitHub: `git push origin feature/new-feature`
4. Create PR targeting `staging` branch

**Staging Testing:**
1. Merge PR to `staging` branch
2. Vercel auto-deploys to `staging.nextbestmove.app`
3. Test thoroughly on staging
4. Create PR from `staging` → `main` for production release

**Production Release:**
1. Merge `staging` → `main` (after staging tests pass)
2. Vercel auto-deploys to `nextbestmove.app`
3. Apply Supabase migrations to production (manual or CI)

### 1.3 Branch Protection Rules

**Production (`main`):**
- ✅ Require pull request reviews
- ✅ Require status checks to pass (lint, type-check, tests)
- ✅ Require branches to be up to date before merging
- ✅ No direct pushes (must go through PR)

**Staging (`staging`):**
- ✅ Require pull request reviews (can be self-approval for solo dev)
- ✅ Require status checks to pass
- ✅ Allow force pushes (for emergency fixes, but discouraged)

---

## 2. Supabase Staging Setup

### 2.1 Project Separation (Critical)

**Supabase requires hard separation at the project level.**

You must create **2 separate Supabase projects:**

#### Project 1: Production
- **Name:** `nextbestmove-prod`
- **Database:** `nextbestmove_prod`
- **Auth users:** Real production users only
- **API keys:** Production keys (never share with staging)
- **URL:** `https://<prod-project-id>.supabase.co`

#### Project 2: Staging
- **Name:** `nextbestmove-staging`
- **Database:** `nextbestmove_staging`
- **Auth users:** Test users only
- **API keys:** Staging keys (separate from production)
- **URL:** `https://<staging-project-id>.supabase.co`

**⚠️ CRITICAL:** Supabase does NOT support multi-environment inside one project. You must isolate at the project level.

### 2.2 Environment Variables

**Production (Vercel):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://<prod-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<prod-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<prod-service-key>
```

**Staging (Vercel):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://<staging-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<staging-service-key>
```

**⚠️ Never reuse production keys in staging.**

### 2.3 Database Migration Strategy

**Option A: Shared Migrations (Recommended)**

Use the same `supabase/migrations/` folder for both environments:

```bash
# Apply to staging
supabase db push --project-ref <staging-project-id>

# Apply to production (after staging tests pass)
supabase db push --project-ref <production-project-id>
```

**Option B: Reset Staging Regularly**

Useful when staging environments drift or for clean testing:

```bash
# Reset staging to match migrations
supabase db reset --project-ref <staging-project-id>
```

**Migration Workflow:**
1. Create migration: `supabase migration new <migration-name>`
2. Test on local Supabase first
3. Apply to staging: `supabase db push --project-ref <staging-id>`
4. Test on staging environment
5. Apply to production: `supabase db push --project-ref <prod-id>`

### 2.4 Auth Configuration

**Staging Best Practices:**

- ✅ **Disable email confirmations** (or use test email domains)
- ✅ **Create test accounts only** (no real user signups)
- ✅ **Turn off OAuth providers** unless specifically testing OAuth
- ✅ **Use test redirect URLs** (e.g., `https://staging.nextbestmove.app/auth/callback`)
- ✅ **Disable "invite users" email functionality**
- ✅ **Use test email addresses** (e.g., `test+staging@example.com`)

**Production:**
- ✅ Email confirmations enabled
- ✅ Real OAuth redirect URLs
- ✅ Production email domains

### 2.5 RLS (Row Level Security) Policies

RLS policies are shared via migrations, but test with staging data:

```sql
-- Test RLS policies on staging before production
-- Ensure users can only access their own data
-- Test with multiple test users to verify isolation
```

---

## 3. Vercel Staging Setup

### 3.1 Environment Configuration

Vercel supports three environment types:

1. **Production** - Connected to `main` branch
2. **Preview** - Every PR from feature branches
3. **Development** - Local development (not used for staging)

**For staging, we'll use a dedicated branch deployment:**

1. **Production Environment:**
   - Branch: `main`
   - Domain: `nextbestmove.app`
   - Environment variables: Production set

2. **Staging Environment:**
   - Branch: `staging`
   - Domain: `staging.nextbestmove.app`
   - Environment variables: Staging set

3. **Preview Environments:**
   - Branch: `feature/*`
   - Domain: `feature-xyz-<branch>.vercel.app` (auto-generated)
   - Environment variables: Staging set (safe to use staging data)

### 3.2 Domain Configuration

**In Vercel Dashboard:**

1. Go to Project → Settings → Domains
2. Add production domain: `nextbestmove.app`
3. Add staging domain: `staging.nextbestmove.app`
4. Assign domains:
   - `main` branch → `nextbestmove.app`
   - `staging` branch → `staging.nextbestmove.app`

**DNS Configuration:**

Add CNAME records:
- `nextbestmove.app` → `cname.vercel-dns.com`
- `staging.nextbestmove.app` → `cname.vercel-dns.com`

### 3.3 Environment Variables in Vercel

**Setting Environment Variables:**

1. Go to Vercel → Project → Settings → Environment Variables
2. Add variables for each environment:

**Production:**
```env
NEXT_PUBLIC_SUPABASE_URL=<prod-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<prod-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<prod-service-key>
STRIPE_SECRET_KEY=<prod-secret-key>
STRIPE_WEBHOOK_SECRET=<prod-webhook-secret>
STRIPE_PRICE_ID_STANDARD_MONTHLY=<prod-price-id>
STRIPE_PRICE_ID_STANDARD_YEARLY=<prod-price-id>
STRIPE_PRICE_ID_PROFESSIONAL_MONTHLY=<prod-price-id>
STRIPE_PRICE_ID_PROFESSIONAL_YEARLY=<prod-price-id>
RESEND_API_KEY=<prod-resend-key>
CRON_SECRET=<prod-cron-secret>
NEXT_PUBLIC_APP_URL=https://nextbestmove.app
NEXT_PUBLIC_UMAMI_WEBSITE_ID=<prod-umami-id>
SENTRY_DSN=<prod-sentry-dsn>
```

**Staging:**
```env
NEXT_PUBLIC_SUPABASE_URL=<staging-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<staging-service-key>
STRIPE_SECRET_KEY=<test-secret-key>  # Stripe test mode
STRIPE_WEBHOOK_SECRET=<staging-webhook-secret>
STRIPE_PRICE_ID_STANDARD_MONTHLY=<test-price-id>
STRIPE_PRICE_ID_STANDARD_YEARLY=<test-price-id>
STRIPE_PRICE_ID_PROFESSIONAL_MONTHLY=<test-price-id>
STRIPE_PRICE_ID_PROFESSIONAL_YEARLY=<test-price-id>
RESEND_API_KEY=<staging-resend-key>  # Or use test mode
CRON_SECRET=<staging-cron-secret>
NEXT_PUBLIC_APP_URL=https://staging.nextbestmove.app
NEXT_PUBLIC_UMAMI_WEBSITE_ID=<staging-umami-id>
SENTRY_DSN=<staging-sentry-dsn>
```

**Preview (uses Staging values):**
- Automatically inherits Staging environment variables
- Safe to use staging data for preview deployments

### 3.4 Securing Staging Site

**Option 1: Vercel Password Protection (Recommended)**

Vercel Pro supports password protection:

1. Go to Project → Settings → Deployment Protection
2. Enable "Password Protection" for `staging` branch
3. Set password (shared with team)
4. Staging site requires password before loading

**Option 2: Middleware-Based Protection**

If Vercel Pro is not available, use Next.js middleware:

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Only protect staging environment
  if (process.env.NEXT_PUBLIC_APP_URL?.includes("staging")) {
    const auth = request.headers.get("authorization");
    const expectedAuth = `Basic ${Buffer.from(
      `${process.env.STAGING_USER}:${process.env.STAGING_PASS}`
    ).toString("base64")}`;

    if (!auth || auth !== expectedAuth) {
      return new NextResponse("Unauthorized", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Staging Environment"',
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"],
};
```

**Option 3: IP Restriction**

Restrict access to specific IPs (if team has static IPs):

```typescript
// middleware.ts
const ALLOWED_IPS = process.env.STAGING_ALLOWED_IPS?.split(",") || [];

export function middleware(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_APP_URL?.includes("staging")) {
    const ip = request.ip || request.headers.get("x-forwarded-for");
    if (!ALLOWED_IPS.includes(ip || "")) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }
  return NextResponse.next();
}
```

---

## 4. Stripe Staging Setup

### 4.1 Test Mode vs Live Mode

**Staging MUST use Stripe Test Mode:**

- ✅ Use Stripe test API keys (start with `sk_test_` and `pk_test_`)
- ✅ Use Stripe test webhook secret
- ✅ Use Stripe test price IDs (create test products/prices)
- ✅ Never process real payments in staging

**Production uses Live Mode:**
- ✅ Use Stripe live API keys (start with `sk_live_` and `pk_live_`)
- ✅ Use Stripe live webhook secret
- ✅ Use Stripe live price IDs

### 4.2 Stripe Test Mode Configuration

**In Stripe Dashboard:**

1. **Switch to Test Mode** (toggle in top right)
2. **Create Test Products:**
   - Standard Plan (Monthly): $29.00
   - Standard Plan (Yearly): $249.00
   - Professional Plan (Monthly): $79.00
   - Professional Plan (Yearly): $649.00
3. **Copy Test Price IDs** to staging environment variables
4. **Create Test Webhook Endpoint:**
   - URL: `https://staging.nextbestmove.app/api/billing/webhook`
   - Events: All billing events
   - Copy webhook secret to staging env vars

### 4.3 Stripe Webhook Testing

**Test Webhook Locally:**
```bash
# Use Stripe CLI
stripe listen --forward-to localhost:3000/api/billing/webhook
```

**Test Webhook on Staging:**
- Use Stripe Dashboard → Webhooks → Send test webhook
- Verify staging webhook endpoint receives events
- Check staging database for webhook processing

### 4.4 Stripe Test Cards

Use Stripe test cards for testing:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

---

## 5. Resend Email Service Setup

### 5.1 Separate API Keys

**Staging:**
- Use separate Resend API key (or Resend test mode if available)
- Configure staging domain: `staging@nextbestmove.app`
- Use test email addresses for recipients

**Production:**
- Use production Resend API key
- Configure production domain: `noreply@nextbestmove.app`
- Send to real user emails

### 5.2 Email Configuration

**Staging Best Practices:**
- ✅ Send emails to test addresses only
- ✅ Add `[STAGING]` prefix to email subjects
- ✅ Use test email domains (e.g., `test+staging@example.com`)
- ✅ Log all emails (don't actually send in some cases)

**Production:**
- ✅ Send to real user emails
- ✅ Use production email templates
- ✅ Monitor email delivery rates

### 5.3 Email Testing

**Test Email Endpoints:**
- `/api/test/send-day0-email` - Test Day 0 email
- `/api/test/send-payment-failure-email` - Test payment failure email
- `/api/test/send-win-back-email` - Test win-back email

These endpoints should only work in staging/development.

---

## 6. Cron Jobs & Background Tasks

### 6.1 Cron Secret Separation

**Staging:**
- Use separate `CRON_SECRET` for staging
- Staging cron jobs should not affect production data
- Test cron jobs on staging before production

**Production:**
- Use production `CRON_SECRET`
- Production cron jobs process real user data

### 6.2 Cron Job Configuration

**Vercel Cron Jobs:**

Configure in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-plans",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/weekly-summaries",
      "schedule": "0 8 * * 1"
    },
    {
      "path": "/api/cron/payment-failure-recovery",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/streak-recovery",
      "schedule": "0 10 * * *"
    },
    {
      "path": "/api/cron/win-back-campaign",
      "schedule": "0 11 * * *"
    }
  ]
}
```

**Staging Cron Jobs:**
- Same schedule, but process staging data only
- Use staging `CRON_SECRET`
- Test cron job logic on staging before production

### 6.3 Manual Cron Testing

**Test cron endpoints manually:**

```bash
# Test with curl
curl -X POST "https://staging.nextbestmove.app/api/cron/daily-plans" \
  -H "Authorization: Bearer <staging-cron-secret>"
```

---

## 7. Monitoring & Observability

### 7.1 Sentry Error Tracking

**Staging:**
- Use separate Sentry project: `nextbestmove-staging`
- Use staging `SENTRY_DSN`
- Tag errors with `environment: staging`

**Production:**
- Use production Sentry project: `nextbestmove-prod`
- Use production `SENTRY_DSN`
- Tag errors with `environment: production`

### 7.2 Umami Analytics

**Staging:**
- Use separate Umami website ID for staging
- Track staging traffic separately
- Use `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (staging value)

**Production:**
- Use production Umami website ID
- Track production traffic
- Use `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (production value)

### 7.3 GlitchTip (Alternative to Sentry)

If using GlitchTip:
- Create separate projects for staging and production
- Use different DSNs for each environment

---

## 8. Deployment Workflow

### 8.1 Staging Deployment

**Automatic (Recommended):**
1. Push to `staging` branch
2. Vercel automatically deploys to `staging.nextbestmove.app`
3. Apply Supabase migrations: `supabase db push --project-ref <staging-id>`
4. Test on staging environment

**Manual (If needed):**
```bash
# Trigger manual deployment via Vercel CLI
vercel --prod --scope=your-team
```

### 8.2 Production Deployment

**Process:**
1. Ensure all tests pass on staging
2. Create PR: `staging` → `main`
3. Review and merge PR
4. Vercel automatically deploys to `nextbestmove.app`
5. Apply Supabase migrations: `supabase db push --project-ref <prod-id>`
6. Monitor production deployment
7. Verify production site is working

### 8.3 Rollback Procedure

**If production deployment fails:**

1. **Vercel Rollback:**
   - Go to Vercel → Project → Deployments
   - Find last working deployment
   - Click "..." → "Promote to Production"

2. **Database Rollback:**
   - If migration caused issues, rollback migration:
   ```bash
   # Create rollback migration
   supabase migration new rollback_<migration-name>
   # Apply rollback
   supabase db push --project-ref <prod-id>
   ```

3. **Environment Variable Rollback:**
   - Revert environment variable changes in Vercel
   - Redeploy to apply changes

---

## 9. Security Requirements (Non-Negotiable)

### 9.1 Mandatory Separations

- ✅ **Staging must never share Supabase project with production**
- ✅ **Never reuse API keys across environments**
- ✅ **Staging must use Stripe test mode (never live mode)**
- ✅ **Lock staging behind password protection or IP restrictions**
- ✅ **Disable staging signups or restrict to test emails**
- ✅ **Do not send real emails or process real payments in staging**
- ✅ **Keep secrets separated at the branch/environment level**
- ✅ **Use separate monitoring/analytics projects**

### 9.2 Access Control

**Staging Access:**
- Password protection (Vercel Pro or middleware)
- IP restrictions (if team has static IPs)
- Team members only (no public access)

**Production Access:**
- Public access (authenticated users only)
- No password protection
- Real user data

### 9.3 Secret Management

**Never commit secrets to Git:**
- ✅ Use Vercel environment variables
- ✅ Use `.env.local` for local development (gitignored)
- ✅ Rotate secrets regularly
- ✅ Use different secrets for staging and production

---

## 10. Testing Checklist

### 10.1 Pre-Staging Deployment

- [ ] Code reviewed and approved
- [ ] Lint and type-check pass
- [ ] Tests pass (if applicable)
- [ ] Environment variables set in Vercel
- [ ] Supabase migrations tested locally

### 10.2 Staging Deployment

- [ ] Code merged to `staging` branch
- [ ] Vercel deployment successful
- [ ] Supabase migrations applied to staging
- [ ] Staging site accessible (with password if required)
- [ ] Environment variables verified

### 10.3 Staging Testing

- [ ] Sign up flow works
- [ ] Sign in flow works
- [ ] Daily plan generation works
- [ ] Pin management works
- [ ] Stripe checkout (test mode) works
- [ ] Webhooks process correctly
- [ ] Emails send (to test addresses)
- [ ] Cron jobs run correctly
- [ ] No production data accessed

### 10.4 Pre-Production Deployment

- [ ] All staging tests pass
- [ ] No critical bugs found
- [ ] Performance acceptable
- [ ] Database migrations tested
- [ ] Rollback plan prepared

### 10.5 Production Deployment

- [ ] PR created: `staging` → `main`
- [ ] PR reviewed and approved
- [ ] Code merged to `main`
- [ ] Vercel deployment successful
- [ ] Supabase migrations applied to production
- [ ] Production site verified
- [ ] Monitoring shows no errors

---

## 11. Common Issues & Troubleshooting

### Issue: Staging shows production data

**Cause:** Environment variables pointing to production

**Fix:**
1. Check Vercel environment variables
2. Verify `NEXT_PUBLIC_SUPABASE_URL` points to staging project
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is staging key
4. Redeploy staging

### Issue: Stripe webhooks not working on staging

**Cause:** Webhook URL or secret incorrect

**Fix:**
1. Verify webhook URL in Stripe Dashboard: `https://staging.nextbestmove.app/api/billing/webhook`
2. Verify `STRIPE_WEBHOOK_SECRET` matches staging webhook secret
3. Test webhook with Stripe CLI or Dashboard

### Issue: Emails not sending from staging

**Cause:** Resend API key or domain configuration

**Fix:**
1. Verify `RESEND_API_KEY` is set correctly
2. Verify Resend domain is configured for staging
3. Check Resend dashboard for delivery logs

### Issue: Cron jobs not running

**Cause:** Cron secret or schedule incorrect

**Fix:**
1. Verify `CRON_SECRET` is set in Vercel
2. Verify cron schedule in `vercel.json`
3. Test cron endpoint manually with correct secret

---

## 12. Repository Reference

**GitHub:** https://github.com/MAM1967/NextBestMove

**Key Files:**
- `vercel.json` - Vercel configuration (cron jobs, etc.)
- `supabase/migrations/` - Database migrations
- `.env.local` - Local development environment variables (gitignored)
- `docs/Architecture/` - Architecture documentation

---

## 13. Implementation Timeline

**This setup will be implemented:**
- **When:** After P1 backlog completion
- **Priority:** Last P1 item before moving to P2
- **Estimated Time:** 1-2 days for initial setup
- **Ongoing:** Maintenance and refinement as needed

---

**End of Staging Environment Setup Guide**

