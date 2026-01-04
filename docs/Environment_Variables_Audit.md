# Environment Variables Audit

**Date:** January 3, 2026  
**Status:** ✅ Complete  
**Auditor:** Security & Monitoring Workstream

## Overview

This document provides a comprehensive audit of all environment variables used in the NextBestMove application, with a focus on identifying any secrets that may be exposed to the client-side bundle.

## Audit Methodology

1. Scanned all `NEXT_PUBLIC_*` variables in the codebase
2. Verified each variable's usage and scope (client vs server)
3. Confirmed no secrets are exposed to the client
4. Documented all variables with their purpose and scope

---

## NEXT_PUBLIC_* Variables (Client-Side Accessible)

### ✅ Safe Variables (No Secrets)

#### `NEXT_PUBLIC_SUPABASE_URL`
- **Scope:** Client + Server
- **Purpose:** Supabase project URL (public, safe to expose)
- **Usage:** Used in Supabase client initialization
- **Files:**
  - `web/src/lib/supabase/client.ts`
  - `web/src/lib/supabase/server.ts`
  - `web/src/lib/supabaseClient.ts`
  - `web/src/middleware.ts`
  - `web/src/lib/supabase/admin.ts`
- **Security:** ✅ Safe - This is a public URL, not a secret

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Scope:** Client + Server
- **Purpose:** Supabase anonymous key (public, safe to expose)
- **Usage:** Used in Supabase client initialization
- **Files:**
  - `web/src/lib/supabase/client.ts`
  - `web/src/lib/supabase/server.ts`
  - `web/src/lib/supabaseClient.ts`
  - `web/src/middleware.ts`
- **Security:** ✅ Safe - This is a public anonymous key designed to be exposed. Row Level Security (RLS) policies protect data access.

#### `NEXT_PUBLIC_APP_URL`
- **Scope:** Client + Server
- **Purpose:** Application base URL for email links and redirects
- **Usage:** Used in email templates and redirect URLs
- **Files:**
  - `web/src/lib/email/resend.ts`
  - `web/src/lib/email/notifications.ts`
  - `web/src/app/api/billing/customer-portal/route.ts`
  - `web/src/app/api/billing/create-checkout-session/route.ts`
  - `web/src/app/auth/sign-up/actions.ts`
  - `web/src/app/api/unsubscribe/route.ts`
  - `web/src/app/api/test-email/route.ts`
  - `web/src/app/auth/forgot-password/actions.ts`
- **Security:** ✅ Safe - Public URL, not a secret

#### `NEXT_PUBLIC_ENVIRONMENT`
- **Scope:** Client + Server
- **Purpose:** Environment identifier (staging/production)
- **Usage:** Used to determine environment-specific behavior
- **Files:**
  - `web/src/lib/email/resend.ts`
  - `web/src/app/api/test/send-payment-failure-email/route.ts`
  - `web/src/app/auth/sign-in/actions.ts`
  - `web/src/middleware.ts`
- **Security:** ✅ Safe - Public identifier, not a secret

#### `NEXT_PUBLIC_UMAMI_URL`
- **Scope:** Client
- **Purpose:** Umami analytics service URL
- **Usage:** Used in `web/src/components/UmamiScript.tsx`
- **Security:** ✅ Safe - Public analytics URL, not a secret

#### `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
- **Scope:** Client
- **Purpose:** Umami website ID for analytics
- **Usage:** Used in `web/src/components/UmamiScript.tsx`
- **Security:** ✅ Safe - Public website ID, not a secret

#### `NEXT_PUBLIC_POSTHOG_KEY`
- **Scope:** Client
- **Purpose:** PostHog analytics API key
- **Usage:** Used in `web/src/components/PostHogInit.tsx`
- **Security:** ✅ Safe - PostHog public key, designed to be exposed. PostHog uses separate write/read keys.

#### `NEXT_PUBLIC_POSTHOG_HOST`
- **Scope:** Client
- **Purpose:** PostHog API host URL
- **Usage:** Used in `web/src/components/PostHogInit.tsx`
- **Security:** ✅ Safe - Public URL, not a secret

#### `NEXT_PUBLIC_GLITCHTIP_DSN`
- **Scope:** Client
- **Purpose:** GlitchTip (Sentry-compatible) error tracking DSN
- **Usage:** Used in Sentry initialization
- **Security:** ✅ Safe - DSN is public and designed to be exposed. It's a public key, not a secret.

---

## Server-Only Variables (NOT in NEXT_PUBLIC_*)

These variables are **NOT** exposed to the client and are safe:

- `SUPABASE_SERVICE_ROLE_KEY` - Server-only, never in client bundle ✅
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Server-only ✅
- `OUTLOOK_CLIENT_ID` / `OUTLOOK_CLIENT_SECRET` / `OUTLOOK_TENANT_ID` - Server-only ✅
- `CALENDAR_ENCRYPTION_KEY` - Server-only ✅
- `STRIPE_SECRET_KEY` - Server-only ✅
- `STRIPE_WEBHOOK_SECRET` - Server-only ✅
- `STRIPE_PRICE_ID_*` - Server-only ✅
- `RESEND_API_KEY` - Server-only ✅
- `OPENAI_API_KEY` - Server-only ✅
- `CRON_SECRET` - Server-only ✅
- `CRON_JOB_ORG_API_KEY` - Server-only ✅
- `STAGING_USER` / `STAGING_PASS` - Server-only ✅
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` - Server-only ✅
- `ENABLE_RATE_LIMITING` - Server-only ✅
- `ENABLE_CORS_RESTRICTION` - Server-only ✅

---

## Security Findings

### ✅ No Secrets Exposed

**All `NEXT_PUBLIC_*` variables are safe to expose:**

1. **Supabase Keys:** The anonymous key is designed to be public. RLS policies protect data access.
2. **Analytics Keys:** PostHog and Umami keys are public keys designed for client-side use.
3. **Error Tracking:** GlitchTip DSN is a public key, not a secret.
4. **URLs:** All URLs are public endpoints, not secrets.

### ✅ Best Practices Followed

1. **Service Role Key:** `SUPABASE_SERVICE_ROLE_KEY` is correctly kept server-only
2. **API Keys:** All sensitive API keys (Stripe, Resend, OpenAI) are server-only
3. **OAuth Secrets:** All OAuth client secrets are server-only
4. **Encryption Keys:** Calendar encryption key is server-only

---

## Recommendations

### ✅ Current State: Secure

No changes required. The codebase correctly separates public and private environment variables.

### Future Considerations

1. **Environment Variable Documentation:** Consider adding JSDoc comments to document expected environment variables
2. **Type Safety:** Consider using a schema validation library (e.g., `zod`) to validate environment variables at startup
3. **Runtime Validation:** Add runtime checks to ensure required environment variables are set

---

## Complete Environment Variable List

### Client-Side (NEXT_PUBLIC_*)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_APP_URL` - Application base URL
- `NEXT_PUBLIC_ENVIRONMENT` - Environment identifier
- `NEXT_PUBLIC_UMAMI_URL` - Umami analytics URL
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID` - Umami website ID
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog analytics key
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog API host
- `NEXT_PUBLIC_GLITCHTIP_DSN` - GlitchTip error tracking DSN

### Server-Side Only
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (secret)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth (secret)
- `OUTLOOK_CLIENT_ID` / `OUTLOOK_CLIENT_SECRET` / `OUTLOOK_TENANT_ID` - Microsoft OAuth (secret)
- `CALENDAR_ENCRYPTION_KEY` - Calendar token encryption key (secret)
- `STRIPE_SECRET_KEY` - Stripe API key (secret)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (secret)
- `STRIPE_PRICE_ID_STANDARD_MONTHLY` / `STRIPE_PRICE_ID_STANDARD_YEARLY` - Stripe price IDs
- `STRIPE_PRICE_ID_PREMIUM_MONTHLY` / `STRIPE_PRICE_ID_PREMIUM_YEARLY` - Stripe price IDs
- `RESEND_API_KEY` - Resend email API key (secret)
- `OPENAI_API_KEY` - OpenAI API key (secret)
- `CRON_SECRET` - Cron job authentication secret
- `CRON_JOB_ORG_API_KEY` - cron-job.org API key (secret)
- `STAGING_USER` / `STAGING_PASS` - Staging basic auth credentials (secret)
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis credentials (secret)
- `ENABLE_RATE_LIMITING` - Feature flag for rate limiting
- `ENABLE_CORS_RESTRICTION` - Feature flag for CORS restrictions

---

## Verification

✅ **All `NEXT_PUBLIC_*` variables verified safe to expose**  
✅ **All secrets correctly kept server-only**  
✅ **No security vulnerabilities identified**

---

**Audit Status:** ✅ **PASS** - No security issues found

