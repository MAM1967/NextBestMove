# Fix Google OAuth Staging Client - Deleted Client Error

**Date:** December 9, 2025  
**Issue:** Google OAuth showing "Error 401: deleted_client" on staging  
**Error Client ID:** `732850218816-6b8ft52uum9dh2m18uk86jo4o8dk96cm` (deleted)

---

## Problem

Staging is trying to use a deleted Google OAuth client ID:
- **Current (wrong):** `732850218816-6b8ft52uum9dh2m18uk86jo4o8dk96cm` ❌ (deleted)
- **Should be:** `732850218816-kgrh...` ✅ (NextBestMove-Test client)

---

## Solution

### Step 1: Verify Doppler Has Correct Client ID

Doppler `stg` config should have:
- `GOOGLE_CLIENT_ID` = `732850218816-kgrhcoagfcibsrrta1qa1k32d3en9maj.apps.googleusercontent.com` (or similar starting with `732850218816-kgrh...`)

**Check:**
```bash
doppler secrets get GOOGLE_CLIENT_ID --config stg --project nextbestmove-prd --plain
```

**Expected:** Should start with `732850218816-kgrh...`

---

### Step 2: Sync Doppler to Vercel Preview

Sync secrets from Doppler to Vercel Preview environment:

```bash
cd /Users/michaelmcdermott/NextBestMove
bash scripts/sync-doppler-to-vercel-preview.sh
```

This syncs all secrets from Doppler `stg` config to Vercel Preview environment.

---

### Step 3: Verify Vercel Preview Environment Variables

**Check via Vercel CLI:**
```bash
vercel env ls preview | grep GOOGLE_CLIENT_ID
```

**Or check in Vercel Dashboard:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Filter by **Preview** scope
3. Find `GOOGLE_CLIENT_ID`
4. Should start with `732850218816-kgrh...`

---

### Step 4: Redeploy Staging

After syncing secrets, redeploy staging to pick up new environment variables:

**Option A: Via Vercel Dashboard**
1. Go to Deployments
2. Find latest staging deployment
3. Click **Redeploy**

**Option B: Via Git Push**
```bash
# Make a small change and push to staging branch
git commit --allow-empty -m "Trigger redeploy to pick up updated Google OAuth credentials"
git push origin staging
```

---

### Step 5: Verify Fix

**Check Debug Endpoint:**
Visit: `https://staging.nextbestmove.app/api/debug-oauth`

**Expected Response:**
```json
{
  "isStaging": true,
  "googleClientIdPrefix": "732850218816-kgrh...",
  "isStagingClient": true,
  "clientIdMatchesEnvironment": true,
  "recommendation": "Configuration looks correct"
}
```

**Test OAuth:**
1. Sign in to staging
2. Go to Settings → Calendar
3. Click "Connect Google Calendar"
4. Should redirect to Google OAuth (not show deleted_client error)

---

## Root Cause

The deleted client ID (`732850218816-6b8ft52uum9dh2m18...`) was likely:
1. An old staging client that was deleted in Google Cloud Console
2. Still cached in Vercel Preview environment variables
3. Not updated when Doppler was set up

---

## Prevention

- ✅ Always use Doppler as source of truth for secrets
- ✅ Run `sync-doppler-to-vercel-preview.sh` after updating secrets in Doppler
- ✅ Verify secrets are synced before deploying
- ✅ Use debug endpoint (`/api/debug-oauth`) to verify configuration

---

## Quick Reference: Client ID Mapping

| Environment | OAuth Client        | Client ID Prefix | Full Client ID (Example)                    |
|-------------|---------------------|-----------------|---------------------------------------------|
| **Production** | `NextBestMove`      | `732850218816-5een...` | `732850218816-5eenvpldj6cd3i1abv18s8udqqs6s9gk.apps.googleusercontent.com` |
| **Staging**    | `NextBestMove-Test` | `732850218816-kgrh...` | `732850218816-kgrhcoagfcibsrrta1qa1k32d3en9maj.apps.googleusercontent.com` |

---

**Last Updated:** December 9, 2025

