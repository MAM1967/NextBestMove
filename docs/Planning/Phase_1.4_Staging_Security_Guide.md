# Phase 1.4: Staging Security Setup Guide

**Status:** ✅ Implementation Complete  
**Time Estimate:** 5 minutes to configure

---

## Overview

Basic Auth protection has been implemented in the middleware to secure the staging environment. This protection:
- ✅ Only activates in staging environment
- ✅ Excludes API routes (webhooks, cron jobs work without Basic Auth)
- ✅ Uses environment variables for credentials
- ✅ Prompts browser for username/password

---

## Implementation Details

### Middleware Changes

The `web/src/middleware.ts` file now includes Basic Auth protection that:
1. Checks if we're in staging environment (via `VERCEL_ENV=preview` or hostname check)
2. Skips Basic Auth for `/api/*` routes
3. Prompts for credentials if not provided
4. Validates credentials against `STAGING_USER` and `STAGING_PASS` env vars

### Environment Variables

**⚠️ IMPORTANT: All environment variables are stored in Doppler and synced to Vercel automatically.**

**Doppler is the source of truth** for all environment variables. The `sync-doppler-to-vercel-preview.sh` script automatically syncs all variables from Doppler to Vercel Preview environment.

| Variable | Description | Example | Location |
|----------|-------------|---------|----------|
| `STAGING_USER` | Username for Basic Auth | `staging` | **Doppler** (synced to Vercel) |
| `STAGING_PASS` | Password for Basic Auth | `SecurePassword123!` | **Doppler** (synced to Vercel) |

**Setup:**
1. Add `STAGING_USER` and `STAGING_PASS` to Doppler (project: `nextbestmove-prd`, config: `prd`)
2. Run `./scripts/sync-doppler-to-vercel-preview.sh` to sync to Vercel
3. Or they will be synced automatically during deployment via `deploy-staging.sh`

**Note:** If these variables are not set, Basic Auth will be skipped (useful for testing).

---

## Setup Instructions

### Step 0: Disable Vercel Password Protection (IMPORTANT!)

**If you see "Log in to Vercel" when visiting staging, you need to disable Vercel's built-in password protection first:**

1. Go to Vercel Dashboard → Your Project → **Settings** → **Deployment Protection**
2. Disable **Password Protection** for Preview deployments
3. This allows our Basic Auth middleware to handle authentication instead

**See:** `docs/Planning/Phase_1.4_Disable_Vercel_Password_Protection.md` for detailed steps.

### Step 1: Add Environment Variables to Doppler

**⚠️ IMPORTANT: Environment variables are managed in Doppler, not directly in Vercel.**

1. Go to Doppler Dashboard → Project: `nextbestmove-prd` → Config: `prd`
2. Add the following variables:
   - `STAGING_USER` = `staging` (or your preferred username)
   - `STAGING_PASS` = `[your-secure-password]` (use a strong password)

3. **Sync to Vercel:**
   - Run `./scripts/sync-doppler-to-vercel-preview.sh` to sync all variables from Doppler to Vercel
   - Or they will be synced automatically during deployment via `deploy-staging.sh`

**Why Doppler?**
- Single source of truth for all environment variables
- Avoids Vercel environment variable sync issues
- Easier to manage and update
- Automatic sync during deployment

### Step 2: Redeploy Staging

After adding the environment variables, trigger a new deployment:
- Push a commit to `staging` branch, OR
- Go to Vercel Dashboard → Deployments → Redeploy latest

### Step 3: Test Basic Auth

1. **Test without credentials:**
   - Open `https://staging.nextbestmove.app` in an incognito window
   - You should see a browser authentication prompt
   - Cancel the prompt → Should see "401 Authentication required"

2. **Test with credentials:**
   - Open `https://staging.nextbestmove.app`
   - Enter username: `[STAGING_USER value]`
   - Enter password: `[STAGING_PASS value]`
   - Should successfully load the site

3. **Test API routes (should work without Basic Auth):**
   - Test webhook endpoint: `https://staging.nextbestmove.app/api/billing/webhook`
   - Should not require Basic Auth (webhooks need to work)

---

## Security Considerations

### ✅ What's Protected
- All page routes (`/`, `/app/*`, `/auth/*`, etc.)
- Static assets (images, fonts, etc.)
- All non-API routes

### ✅ What's NOT Protected
- API routes (`/api/*`) - Required for webhooks, cron jobs, external integrations
- This is intentional - webhooks from Stripe, Resend, etc. cannot provide Basic Auth

### 🔒 Additional Security Options

If you need stricter security:

1. **IP Restrictions (Vercel Pro):**
   - Configure IP allowlist in Vercel Dashboard
   - Only allow specific IPs to access staging

2. **VPN Access:**
   - Use a VPN for team access
   - Combine with Basic Auth for defense in depth

3. **Remove Basic Auth:**
   - Simply don't set `STAGING_USER` and `STAGING_PASS`
   - Basic Auth will be skipped automatically

---

## Troubleshooting

### Issue: Basic Auth not prompting
**Solution:** 
- Check that `STAGING_USER` and `STAGING_PASS` are set in **Doppler** (project: `nextbestmove-prd`, config: `prd`)
- Run `./scripts/sync-doppler-to-vercel-preview.sh` to sync to Vercel
- Verify the deployment has the latest code
- Check browser console for errors
- Check Vercel build logs for environment variable presence

### Issue: Can't access API routes
**Solution:** 
- API routes should NOT require Basic Auth
- If they do, check the middleware matcher config
- Verify the route starts with `/api/`

### Issue: Credentials not working
**Solution:**
- Verify environment variables are set correctly in Vercel
- Check for typos in username/password
- Try clearing browser cache/cookies
- Use incognito mode to test

---

## Acceptance Criteria

- [x] Basic Auth middleware implemented
- [ ] `STAGING_USER` and `STAGING_PASS` added to Vercel (Preview scope)
- [ ] Staging site prompts for credentials
- [ ] Correct credentials allow access
- [ ] API routes work without Basic Auth
- [ ] Team members can access with credentials

---

## Next Steps

After completing this phase:
- ✅ Phase 1.4: Staging Security
- ⏭️ Phase 1.5: Stripe Test Mode Setup

---

**Last Updated:** January 2025

