# Phase 1.3: Environment Variables Strategy

**Issue:** Variables were added to all environments, but we need separate staging values.

---

## Solution: Add Preview-Scoped Variables

You don't need to delete existing variables. Instead:

### Strategy

1. **Keep Production Variables As-Is**
   - Leave production variables scoped to "Production" (and Development if needed)
   - These will continue to work for production deployments

2. **Add Staging-Specific Variables Scoped to "Preview"**
   - Add NEW variables with the same names but scoped ONLY to "Preview"
   - Vercel will automatically use the Preview-scoped ones for staging deployments
   - Vercel will use Production-scoped ones for production deployments

### How Vercel Resolves Variables

When deploying:
- **Production branch (main):** Uses variables scoped to "Production"
- **Preview branches (staging, etc.):** Uses variables scoped to "Preview"
- **Local dev:** Uses variables scoped to "Development"

If a variable exists in multiple scopes with the same name, Vercel uses the most specific one for that environment.

---

## Variables to Add (Scoped to Preview Only)

### Supabase Staging (Must be Preview-only)

```
NEXT_PUBLIC_SUPABASE_URL
Value: https://adgiptzbxnzddbgfeuut.supabase.co
Scope: ✅ Preview only

NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZ2lwdHpieG56ZGRiZ2ZldXV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4Nzk0MzIsImV4cCI6MjA4MDQ1NTQzMn0.ux0Hwx3zKUDqjYz1_6nJJqSQ8lHUkezcLl-m8VDZWUQ
Scope: ✅ Preview only

SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZ2lwdHpieG56ZGRiZ2ZldXV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg3OTQzMiwiZXhwIjoyMDgwNDU1NDMyfQ.-JUP_rXGxxxyv6Rk0ThtCZYZou_d33zuGJU33xy6eoo
Scope: ✅ Preview only
```

### Application URL (Must be Preview-only)

```
NEXT_PUBLIC_APP_URL
Value: https://staging.nextbestmove.app
Scope: ✅ Preview only
```

### Stripe Test Mode (Must be Preview-only)

```
STRIPE_SECRET_KEY
Value: sk_test_... (test mode key)
Scope: ✅ Preview only

STRIPE_WEBHOOK_SECRET
Value: whsec_... (staging webhook secret)
Scope: ✅ Preview only

STRIPE_PRICE_ID_STANDARD_MONTHLY
Value: price_... (test mode price ID)
Scope: ✅ Preview only

STRIPE_PRICE_ID_STANDARD_YEARLY
Value: price_... (test mode price ID)
Scope: ✅ Preview only

STRIPE_PRICE_ID_PREMIUM_MONTHLY
Value: price_... (test mode price ID)
Scope: ✅ Preview only

STRIPE_PRICE_ID_PREMIUM_YEARLY
Value: price_... (test mode price ID)
Scope: ✅ Preview only
```

### Variables That Can Be Shared (Optional)

These can stay scoped to all environments if you're using the same keys:

- `OPENAI_API_KEY` (if using same key)
- `RESEND_API_KEY` (if using same key)
- `CALENDAR_ENCRYPTION_KEY` (if using same key)
- OAuth keys (if using same credentials)

### Variables That Should Be Separate

- `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (create separate staging website)
- `NEXT_PUBLIC_GLITCHTIP_DSN` (create separate staging project)
- `CRON_SECRET` (can be different for staging)

---

## Step-by-Step Process

1. **Go to:** Settings → Environment Variables
2. **For each staging variable:**
   - Click "Add" or "+ Add"
   - Enter variable name
   - Enter staging value
   - **Only check "Preview"** (uncheck Production and Development)
   - Save

3. **Verify:**
   - Production variables should only have "Production" checked
   - Staging variables should only have "Preview" checked
   - Shared variables can have multiple checked

---

## Quick Checklist

Add these variables scoped to **Preview only**:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` (staging)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (staging)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (staging)
- [ ] `NEXT_PUBLIC_APP_URL` = `https://staging.nextbestmove.app`
- [ ] `STRIPE_SECRET_KEY` (test mode)
- [ ] `STRIPE_WEBHOOK_SECRET` (staging webhook)
- [ ] `STRIPE_PRICE_ID_STANDARD_MONTHLY` (test)
- [ ] `STRIPE_PRICE_ID_STANDARD_YEARLY` (test)
- [ ] `STRIPE_PRICE_ID_PREMIUM_MONTHLY` (test)
- [ ] `STRIPE_PRICE_ID_PREMIUM_YEARLY` (test)
- [ ] `RESEND_API_KEY` (if different, or keep shared)
- [ ] `CRON_SECRET` (generate new or keep shared)
- [ ] `OPENAI_API_KEY` (if different, or keep shared)
- [ ] `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (staging)
- [ ] `NEXT_PUBLIC_GLITCHTIP_DSN` (staging)

---

**Last Updated:** January 2025

