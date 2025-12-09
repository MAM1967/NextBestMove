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

### ✅ FIXED: Runtime Override Implemented

**Status:** ✅ **RESOLVED** - December 9, 2025

We've implemented a **two-layer fix** to ensure the correct staging Google OAuth credentials are always used:

1. **Build-time override** in `web/next.config.ts` - Forces correct credentials during build
2. **Runtime override** in `web/src/lib/calendar/providers.ts` - Always uses staging credentials for Preview builds at runtime

This ensures that even if Vercel has incorrect cached values, the correct staging credentials (`732850218816-kgrh...`) are always used.

---

### How It Works

**Runtime Override Logic:**
- Detects Preview/Staging environment (`VERCEL_ENV === "preview"` or hostname matches staging)
- **Always** overrides `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` with staging values
- Logs the override for debugging

**Code Location:**
- `web/src/lib/calendar/providers.ts` - `getProviderConfiguration()` function
- `web/next.config.ts` - `env` section with Google OAuth workaround

---

### Verification Steps

### Step 1: Verify Doppler Has Correct Client ID

Doppler `stg` config should have:
- `GOOGLE_CLIENT_ID` = `732850218816-kgrhcoagfcibsrrta1qa1k32d3en9maj.apps.googleusercontent.com` (or similar starting with `732850218816-kgrh...`)

**Check:**
```bash
doppler secrets get GOOGLE_CLIENT_ID --config stg --project nextbestmove-prd --plain
```

**Expected:** Should start with `732850218816-kgrh...`

---

### Step 2: Sync Doppler to Vercel Preview (Recommended)

Sync secrets from Doppler to Vercel Preview environment:

```bash
cd /Users/michaelmcdermott/NextBestMove
bash scripts/sync-doppler-to-vercel-preview.sh
```

**Note:** Even if Vercel has wrong values, the runtime override will still use correct credentials. However, syncing ensures consistency.

---

### Step 3: Verify Fix

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

**Why the fix was needed:**
- Vercel sometimes caches environment variables incorrectly
- Even after syncing from Doppler, Vercel Preview builds might use stale values
- The runtime override ensures correct credentials are used regardless of what Vercel provides

---

## Prevention

- ✅ **Runtime override implemented** - Always uses correct staging credentials for Preview builds
- ✅ Always use Doppler as source of truth for secrets
- ✅ Run `sync-doppler-to-vercel-preview.sh` after updating secrets in Doppler
- ✅ Verify secrets are synced before deploying
- ✅ Use debug endpoint (`/api/debug-oauth`) to verify configuration
- ✅ Check Vercel build logs for override messages: `🔧 RUNTIME WORKAROUND: Overriding Google OAuth credentials for staging`

---

## Quick Reference: Client ID Mapping

| Environment | OAuth Client        | Client ID Prefix | Full Client ID (Example)                    |
|-------------|---------------------|-----------------|---------------------------------------------|
| **Production** | `NextBestMove`      | `732850218816-5een...` | `732850218816-5eenvpldj6cd3i1abv18s8udqqs6s9gk.apps.googleusercontent.com` |
| **Staging**    | `NextBestMove-Test` | `732850218816-kgrh...` | `732850218816-kgrhcoagfcibsrrta1qa1k32d3en9maj.apps.googleusercontent.com` |

---

---

## Testing

**Test OAuth Connection:**
1. Sign in to staging: `https://staging.nextbestmove.app`
2. Go to Settings → Calendar
3. Click "Connect Google Calendar"
4. Should redirect to Google OAuth consent screen (not show deleted_client error)
5. URL should contain: `client_id=732850218816-kgrhcoagfcibsrrta1qa1k32d3en9maj.apps.googleusercontent.com`

**Check Runtime Logs:**
Look for this log message in Vercel function logs:
```
🔧 RUNTIME WORKAROUND: Overriding Google OAuth credentials for staging
   Original client ID: 732850218816-6b8ft52uum9dh2m18...
   Overriding with staging client ID: 732850218816-kgrhcoagfcibsrrta...
```

---

**Last Updated:** December 9, 2025  
**Status:** ✅ **RESOLVED** - Runtime override ensures correct credentials are always used

