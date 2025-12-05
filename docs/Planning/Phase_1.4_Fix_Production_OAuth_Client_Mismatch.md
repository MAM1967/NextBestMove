# Fix Production OAuth Client Mismatch

**Problem:** Production is using the TEST OAuth client ID but trying to redirect to production URLs.

**Evidence from logs:**
- Client ID: `732850218816-kgrhcoagfcibsrrta...` (This is "NextBestMove-Test" - the STAGING client)
- Redirect URI: `https://nextbestmove.app/api/calendar/callback/google` (This is PRODUCTION)

**Root Cause:** Production environment variables in Vercel are set to TEST client credentials instead of PRODUCTION client credentials.

---

## Step 1: Identify the Correct Client IDs

From Google Cloud Console:

| Client Name | Client ID Starts With | Use For |
|-------------|----------------------|---------|
| **NextBestMove** | `732850218816-5een...` | **PRODUCTION** |
| **NextBestMove-Test** | `732850218816-kgrh...` | **STAGING** |

---

## Step 2: Fix Production Environment Variables in Vercel

1. **Go to Vercel Dashboard:**
   - Your Project → **Settings** → **Environment Variables**

2. **Find `GOOGLE_CLIENT_ID`:**
   - Check which scope it's set to
   - If it's set to **Production** scope, it should be `732850218816-5een...` (NextBestMove)
   - If it's currently `732850218816-kgrh...` (NextBestMove-Test), that's wrong!

3. **Update Production `GOOGLE_CLIENT_ID`:**
   - Click on `GOOGLE_CLIENT_ID`
   - Check the **Production** scope value
   - If it's the test client ID, click **Edit**
   - Change to: `732850218816-5een...` (the production client ID from "NextBestMove")
   - Save

4. **Update Production `GOOGLE_CLIENT_SECRET`:**
   - Click on `GOOGLE_CLIENT_SECRET`
   - Check the **Production** scope value
   - If it's the test client secret, click **Edit**
   - Change to: The production client secret from "NextBestMove" client
   - Save

5. **Verify Preview/Staging Variables:**
   - `GOOGLE_CLIENT_ID` (Preview scope) should be: `732850218816-kgrh...` (NextBestMove-Test) ✅
   - `GOOGLE_CLIENT_SECRET` (Preview scope) should be: The test client secret ✅

---

## Step 3: Verify Redirect URIs in Google Cloud Console

**For "NextBestMove" client (Production):**
- [ ] `https://nextbestmove.app/auth/callback`
- [ ] `https://nextbestmove.app/api/calendar/callback/google`
- [ ] `https://nextbestmove.app` (JavaScript origin)

**For "NextBestMove-Test" client (Staging):**
- [ ] `https://staging.nextbestmove.app/auth/callback`
- [ ] `https://staging.nextbestmove.app/api/calendar/callback/google`
- [ ] `https://staging.nextbestmove.app` (JavaScript origin)

---

## Step 4: Redeploy Production

After updating environment variables:

1. **Trigger a new production deployment:**
   - Push a commit to `main` branch, OR
   - Go to Vercel Dashboard → Deployments → Find latest production deployment → Click **Redeploy**

2. **Wait for deployment to complete**

3. **Test Production OAuth:**
   - Visit: `https://nextbestmove.app/auth/sign-in`
   - Click "Sign in with Google"
   - Should work now!

---

## Summary: Correct Configuration

| Environment | Vercel Scope | OAuth Client | Client ID Starts With |
|-------------|--------------|--------------|----------------------|
| **Production** | Production | NextBestMove | `732850218816-5een...` |
| **Staging** | Preview | NextBestMove-Test | `732850218816-kgrh...` |

---

## Quick Checklist

- [ ] Production `GOOGLE_CLIENT_ID` in Vercel = `732850218816-5een...` (NextBestMove)
- [ ] Production `GOOGLE_CLIENT_SECRET` in Vercel = NextBestMove client secret
- [ ] Preview `GOOGLE_CLIENT_ID` in Vercel = `732850218816-kgrh...` (NextBestMove-Test)
- [ ] Preview `GOOGLE_CLIENT_SECRET` in Vercel = NextBestMove-Test client secret
- [ ] Production redirect URIs added to "NextBestMove" client
- [ ] Staging redirect URIs added to "NextBestMove-Test" client
- [ ] Production redeployed after env var changes

---

**After fixing the environment variables and redeploying, production OAuth should work!** ✅

