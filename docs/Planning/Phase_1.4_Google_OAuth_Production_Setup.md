# Google OAuth Production Setup

**Problem:** Production Google OAuth shows "redirect_uri_mismatch" error.

**Cause:** Production redirect URIs are not configured in the production OAuth client.

---

## Step 1: Identify Required Redirect URIs

For production, you need to add these redirect URIs to your **"NextBestMove"** OAuth client (the production client):

1. **Supabase Auth Callback:**
   ```
   https://nextbestmove.app/auth/callback
   ```

2. **Calendar OAuth Callback:**
   ```
   https://nextbestmove.app/api/calendar/callback/google
   ```

---

## Step 2: Add Redirect URIs to Production OAuth Client

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Select your project

2. **Navigate to Production OAuth Client:**
   - Go to **APIs & Services** → **Credentials**
   - Find **"NextBestMove"** (the production client, NOT "NextBestMove-Test")
   - Click on the client to edit it

3. **Add Authorized Redirect URIs:**
   - Scroll to **Authorized redirect URIs**
   - Click **+ ADD URI**
   - Add: `https://nextbestmove.app/auth/callback`
   - Click **+ ADD URI** again
   - Add: `https://nextbestmove.app/api/calendar/callback/google`
   - Click **SAVE**

4. **Verify Authorized JavaScript Origins:**
   - Scroll to **Authorized JavaScript origins**
   - Ensure `https://nextbestmove.app` is listed
   - If not, add it and click **SAVE**

---

## Step 3: Verify Environment Variables

Make sure production environment variables are set correctly in Vercel:

1. **Go to Vercel Dashboard:**
   - Your Project → **Settings** → **Environment Variables**

2. **Verify Production variables (Production scope):**
   - `GOOGLE_CLIENT_ID` - Should match the **"NextBestMove"** client ID (production)
   - `GOOGLE_CLIENT_SECRET` - Should match the **"NextBestMove"** client secret (production)

3. **Verify Preview/Staging variables (Preview scope):**
   - `GOOGLE_CLIENT_ID` - Should match the **"NextBestMove-Test"** client ID (staging)
   - `GOOGLE_CLIENT_SECRET` - Should match the **"NextBestMove-Test"** client secret (staging)

---

## Summary: Which Client for Which Environment

| Environment | OAuth Client | Client ID Starts With |
|-------------|--------------|----------------------|
| **Production** | `NextBestMove` | `732850218816-5een...` |
| **Staging** | `NextBestMove-Test` | `732850218816-kgrh...` |

---

## Production Redirect URIs Checklist

**For "NextBestMove" client (Production):**
- [ ] `https://nextbestmove.app/auth/callback`
- [ ] `https://nextbestmove.app/api/calendar/callback/google`
- [ ] `https://nextbestmove.app` (JavaScript origin)

**For "NextBestMove-Test" client (Staging):**
- [ ] `https://staging.nextbestmove.app/auth/callback`
- [ ] `https://staging.nextbestmove.app/api/calendar/callback/google`
- [ ] `https://staging.nextbestmove.app` (JavaScript origin)

---

## After Adding Redirect URIs

1. **Wait 1-2 minutes** for Google's changes to propagate

2. **Test Production OAuth:**
   - Visit: `https://nextbestmove.app/auth/sign-in`
   - Click "Sign in with Google"
   - Should redirect to Google OAuth consent screen
   - After consent, should redirect back to production

3. **Test Calendar OAuth:**
   - Sign in to production
   - Go to settings or calendar connection page
   - Click "Connect Google Calendar"
   - Should redirect to Google OAuth consent screen
   - After consent, should redirect back to production

---

## Common Issues

### Issue: Still getting "redirect_uri_mismatch"

**Possible causes:**
- Redirect URI not added to the correct client (production vs test)
- Typo in redirect URI
- Wrong OAuth client ID in Vercel environment variables

**Solution:**
- Double-check you're editing the **"NextBestMove"** client (not Test)
- Verify exact redirect URIs match (no trailing slashes)
- Verify `GOOGLE_CLIENT_ID` in Vercel (Production scope) matches "NextBestMove" client

### Issue: OAuth works but calendar connection fails

**Cause:** Calendar OAuth callback URI might be missing.

**Solution:**
- Ensure `https://nextbestmove.app/api/calendar/callback/google` is added to production client
- Check Vercel function logs for errors

---

**After adding production redirect URIs, Google OAuth should work on production!** ✅

