# GitHub Secrets Audit

## Summary

The workflow expects **23 variables** to sync to Vercel, but you have **23 variables** in GitHub Secrets. However, 3 of them are workflow-only and shouldn't be synced.

## Breakdown

### ✅ Variables That Should Be Synced to Vercel (22)

**Production-only secrets (17):**
1. `SUPABASE_SERVICE_ROLE_KEY`
2. `STRIPE_SECRET_KEY`
3. `STRIPE_WEBHOOK_SECRET`
4. `RESEND_API_KEY`
5. `CRON_SECRET`
6. `CRON_JOB_ORG_API_KEY`
7. `OPENAI_API_KEY`
8. `CALENDAR_ENCRYPTION_KEY`
9. `GOOGLE_CLIENT_ID`
10. `GOOGLE_CLIENT_SECRET`
11. `OUTLOOK_CLIENT_ID`
12. `OUTLOOK_CLIENT_SECRET`
13. `OUTLOOK_TENANT_ID`
14. `NEXT_PUBLIC_GLITCHTIP_DSN`
15. `NEXT_PUBLIC_UMAMI_URL`
16. `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
17. `STRIPE_PRICE_ID_STANDARD_MONTHLY`
18. `STRIPE_PRICE_ID_STANDARD_YEARLY`
19. `STRIPE_PRICE_ID_PROFESSIONAL_MONTHLY`
20. `STRIPE_PRICE_ID_PROFESSIONAL_YEARLY`

**Public variables (all environments) (3):**
21. `NEXT_PUBLIC_SUPABASE_URL`
22. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
23. `NEXT_PUBLIC_APP_URL` ⚠️ **MISSING**

### 🔧 Workflow-Only Secrets (3) - Do NOT Sync to Vercel

These are used by the GitHub Actions workflow itself, not by your application:

1. `VERCEL_TOKEN` - Used to authenticate with Vercel API
2. `VERCEL_ORG_ID` - Used to identify your Vercel organization
3. `VERCEL_PROJECT_ID` - Used to identify your Vercel project

**These should remain in GitHub Secrets but are NOT synced to Vercel.**

### ❓ Extra Secret (1) - Not Used

1. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - Not found in codebase, can be removed

## Action Required

### 1. Add Missing Secret

Add `NEXT_PUBLIC_APP_URL` to GitHub Secrets:

- **Value**: `https://nextbestmove.app` (or your production URL)
- **Note**: If not set, the app uses fallback: `https://nextbestmove.app`

### 2. Optional: Remove Unused Secret

If `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` is not used, you can remove it from GitHub Secrets.

## Current Status

- ✅ **22 variables** are correctly synced to Vercel
- ⚠️ **1 variable** (`NEXT_PUBLIC_APP_URL`) is missing from GitHub Secrets
- ✅ **3 variables** (`VERCEL_*`) are correctly NOT synced (workflow-only)
- ❓ **1 variable** (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`) is unused

## Total Count

- **GitHub Secrets**: 23 (3 workflow-only + 20 app secrets)
- **Vercel Variables**: 23 (all app secrets synced)
- **Missing**: 1 (`NEXT_PUBLIC_APP_URL`)

