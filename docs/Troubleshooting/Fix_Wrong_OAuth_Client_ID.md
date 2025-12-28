# Fix Wrong OAuth Client ID

## Problem
Staging is using the wrong OAuth client ID, causing `redirect_uri_mismatch` errors.

**Current Issue:**
- Staging is using: `732850218816-6b8ft52uum9dh2m18...`
- Should be using: `732850218816-kgrh...` (NextBestMove-Test client)

---

## Step 1: Get Correct Client IDs from Google Cloud Console

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/
   - Select your project
   - Go to **APIs & Services** → **Credentials**

2. **Find "NextBestMove-Test" client (Staging):**
   - Client ID should start with: `732850218816-kgrh...`
   - Copy the full Client ID
   - Copy the Client Secret

3. **Find "NextBestMove" client (Production):**
   - Client ID should start with: `732850218816-5een...`
   - Copy the full Client ID
   - Copy the Client Secret

---

## Step 2: Update Vercel Environment Variables

### For Staging (Preview Scope):

1. **Go to Vercel Dashboard:**
   - Your Project → **Settings** → **Environment Variables**
   - Filter by **Preview** scope

2. **Update `GOOGLE_CLIENT_ID`:**
   - Find `GOOGLE_CLIENT_ID`
   - Click **Edit**
   - Replace with: `732850218816-kgrh...` (NextBestMove-Test client ID)
   - Ensure it's in **Preview** scope only
   - Click **Save**

3. **Update `GOOGLE_CLIENT_SECRET`:**
   - Find `GOOGLE_CLIENT_SECRET`
   - Click **Edit**
   - Replace with: NextBestMove-Test client secret
   - Ensure it's in **Preview** scope only
   - Click **Save**

### For Production (Production Scope):

1. **Filter by Production scope**

2. **Verify `GOOGLE_CLIENT_ID`:**
   - Should be: `732850218816-5eenvpldj6cd3i1abv18s8udqqs6s9gk.apps.googleusercontent.com`
   - If wrong, update to match "NextBestMove" client

3. **Verify `GOOGLE_CLIENT_SECRET`:**
   - Should match "NextBestMove" client secret
   - If wrong, update it

---

## Step 3: Verify Google Cloud Console Redirect URIs

### For "NextBestMove-Test" Client (Staging):

**Authorized Redirect URIs:**
- `https://staging.nextbestmove.app/auth/callback`
- `https://staging.nextbestmove.app/api/calendar/callback/google`

**Authorized JavaScript Origins:**
- `https://staging.nextbestmove.app`

### For "NextBestMove" Client (Production):

**Authorized Redirect URIs:**
- `https://nextbestmove.app/auth/callback`
- `https://nextbestmove.app/api/calendar/callback/google`

**Authorized JavaScript Origins:**
- `https://nextbestmove.app`

---

## Step 4: Redeploy and Test

1. **Redeploy Staging:**
   - Go to Vercel → Deployments
   - Find latest staging deployment
   - Click **Redeploy**

2. **Redeploy Production (if needed):**
   - Find latest production deployment
   - Click **Redeploy**

3. **Test Debug Endpoint:**
   - Staging: `https://staging.nextbestmove.app/api/debug-oauth`
   - Should show: `clientIdMatchesEnvironment: true`
   - Should show: `recommendation: "Configuration looks correct"`

4. **Test OAuth:**
   - Sign in to staging
   - Go to Settings → Calendar
   - Click "Connect Google Calendar"
   - Should work without `redirect_uri_mismatch` error

---

## Quick Reference: Client ID Mapping

| Environment | OAuth Client        | Client ID Prefix | Full Client ID (Example)                    |
|-------------|---------------------|-----------------|---------------------------------------------|
| **Production** | `NextBestMove`      | `732850218816-5een...` | `732850218816-5eenvpldj6cd3i1abv18s8udqqs6s9gk.apps.googleusercontent.com` |
| **Staging**    | `NextBestMove-Test` | `732850218816-kgrh...` | `732850218816-kgrh...` (get from Google Cloud Console) |

---

## Why Production Debug Endpoint Returns 404

The debug endpoint was just created and pushed to `staging` branch. It needs to be:
1. Merged to `main` branch, OR
2. Manually deployed to production

**To fix:**
- The endpoint will be available in production after the next deployment from `main` branch
- Or you can check production OAuth configuration directly in Vercel environment variables

---

## Verification Checklist

**Staging (Preview Scope):**
- [ ] `GOOGLE_CLIENT_ID` starts with `732850218816-kgrh`
- [ ] `GOOGLE_CLIENT_SECRET` matches NextBestMove-Test client
- [ ] Debug endpoint shows `clientIdMatchesEnvironment: true`
- [ ] OAuth works without errors

**Production (Production Scope):**
- [ ] `GOOGLE_CLIENT_ID` starts with `732850218816-5een`
- [ ] `GOOGLE_CLIENT_SECRET` matches NextBestMove client
- [ ] OAuth works without errors










