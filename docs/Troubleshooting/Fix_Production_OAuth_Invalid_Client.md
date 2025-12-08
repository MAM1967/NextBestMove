# Fix Production OAuth Invalid Client Error

## Problem
Production OAuth callback is failing with:
```
error: 'invalid_client',
status: 401,
error_description: 'Unauthorized'
```

This happens when exchanging the authorization code for tokens.

## Root Cause
The error `invalid_client` means Google is rejecting the client ID/secret combination. This happens when:
1. Client ID and secret don't match (from different OAuth clients)
2. Client secret is wrong or missing
3. Client ID is wrong

## Current Situation
- We hardcode the production client ID: `732850218816-5eenvpldj6cd3i1abv18s8udqqs6s9gk.apps.googleusercontent.com`
- Client secret still comes from `GOOGLE_CLIENT_SECRET` environment variable
- If Vercel provides the wrong secret (staging secret instead of production), they won't match

## Solution

### Option 1: Verify Vercel Environment Variables (Recommended First Step)

1. **Go to Vercel Dashboard:**
   - Settings → Environment Variables
   - Filter by **Production** scope

2. **Verify `GOOGLE_CLIENT_SECRET`:**
   - Should match the **"NextBestMove"** client secret (production)
   - Should NOT match the "NextBestMove-Test" client secret (staging)
   - If wrong, update it to the production client secret

3. **Verify `GOOGLE_CLIENT_ID`:**
   - Should be: `732850218816-5eenvpldj6cd3i1abv18s8udqqs6s9gk.apps.googleusercontent.com`
   - (Note: We hardcode this, but verify Vercel has it too)

### Option 2: Hardcode Production Client Secret (If Vercel Bug Persists)

If Vercel continues to provide the wrong client secret, we can hardcode it similar to the client ID workaround.

**Steps:**
1. Get the production client secret from Google Cloud Console
2. Add it to the workaround in `web/src/lib/calendar/providers.ts`
3. Hardcode it for production builds

**⚠️ Security Note:** This exposes the secret in code, but it's necessary if Vercel's environment variable bug persists.

## Debug Steps

After deploying the debug logging:

1. **Check Vercel Logs:**
   - Look for `[Calendar Callback] Production OAuth Debug:` log
   - Verify client ID and secret are both from production

2. **Verify in Google Cloud Console:**
   - Go to APIs & Services → Credentials
   - Find "NextBestMove" client (production)
   - Verify the client secret matches what's in Vercel

3. **Test OAuth Flow:**
   - Try connecting calendar again
   - Check logs for the debug output
   - Verify client ID/secret match

## Expected Log Output

After fix, you should see:
```
[Calendar Callback] Production OAuth Debug: {
  clientIdPrefix: "732850218816-5een...",
  clientIdLength: 73,
  hasClientSecret: true,
  clientSecretLength: 36,
  clientSecretPrefix: "GOCSPX-..."
}
```

If `hasClientSecret: false` or `clientSecretLength: 0`, the secret is missing.

## Quick Checklist

- [ ] `GOOGLE_CLIENT_ID` in Vercel (Production) = `732850218816-5een...`
- [ ] `GOOGLE_CLIENT_SECRET` in Vercel (Production) = "NextBestMove" client secret
- [ ] Client secret matches Google Cloud Console "NextBestMove" client
- [ ] Debug logs show both client ID and secret are present
- [ ] OAuth flow completes successfully

