# Google OAuth Staging Setup

**Problem:** Google OAuth shows "deleted_client" or authorization error on staging.

**Cause:** Staging redirect URIs are not configured in Google Cloud Console.

---

## Step 1: Identify Required Redirect URIs

For staging, you need to add these redirect URIs to your Google OAuth client:

1. **Supabase Auth Callback:**

   ```
   https://staging.nextbestmove.app/auth/callback
   ```

2. **Calendar OAuth Callback:**
   ```
   https://staging.nextbestmove.app/api/calendar/callback/google
   ```

---

## Step 2: Add Redirect URIs to Google Cloud Console

1. **Go to Google Cloud Console:**

   - Visit: https://console.cloud.google.com/
   - Select your project (or the project that has your OAuth client)

2. **Navigate to OAuth Client:**

   - Go to **APIs & Services** → **Credentials**
   - Find your OAuth 2.0 Client ID (the one used for production)
   - Click on the client to edit it

3. **Add Authorized Redirect URIs:**

   - Scroll to **Authorized redirect URIs**
   - Click **+ ADD URI**
   - Add: `https://staging.nextbestmove.app/auth/callback`
   - Click **+ ADD URI** again
   - Add: `https://staging.nextbestmove.app/api/calendar/callback/google`
   - Click **SAVE**

4. **Verify Authorized JavaScript Origins (if needed):**
   - Scroll to **Authorized JavaScript origins**
   - Ensure `https://staging.nextbestmove.app` is listed
   - If not, add it and click **SAVE**

---

## Step 3: Verify Environment Variables

Make sure these are set in Vercel (Preview scope):

1. **Go to Vercel Dashboard:**

   - Your Project → **Settings** → **Environment Variables**

2. **Verify these variables exist (Preview scope):**

   - `GOOGLE_CLIENT_ID` - Should match the client ID in Google Cloud Console
   - `GOOGLE_CLIENT_SECRET` - Should match the client secret in Google Cloud Console

3. **If missing, add them:**
   - Get values from Google Cloud Console → Credentials → Your OAuth Client
   - Add to Vercel with **Preview** scope (not Production)

---

## Step 4: Test OAuth

After adding redirect URIs:

1. **Wait 1-2 minutes** for Google's changes to propagate

2. **Test Supabase Auth (Sign in with Google):**

   - Visit: `https://staging.nextbestmove.app/auth/sign-in`
   - Click "Sign in with Google"
   - Should redirect to Google OAuth consent screen
   - After consent, should redirect back to staging

3. **Test Calendar OAuth:**
   - Sign in to staging
   - Go to settings or calendar connection page
   - Click "Connect Google Calendar"
   - Should redirect to Google OAuth consent screen
   - After consent, should redirect back to staging

---

## Common Issues

### Issue: Still getting "deleted_client" error

**Possible causes:**

- Redirect URI not added correctly (check for typos)
- Wrong OAuth client ID in Vercel environment variables
- Changes haven't propagated yet (wait a few minutes)

**Solution:**

- Double-check redirect URIs in Google Cloud Console
- Verify `GOOGLE_CLIENT_ID` in Vercel matches Google Cloud Console
- Try again after 2-3 minutes

### Issue: "redirect_uri_mismatch" error

**Cause:** The redirect URI in the OAuth request doesn't match what's configured.

**Solution:**

- Verify exact redirect URIs in Google Cloud Console
- Check for trailing slashes (should NOT have trailing slash)
- Ensure HTTPS (not HTTP)

### Issue: OAuth works but calendar connection fails

**Cause:** Calendar OAuth callback URI might be missing.

**Solution:**

- Ensure `https://staging.nextbestmove.app/api/calendar/callback/google` is added
- Check Vercel function logs for errors

---

## Production vs Staging

**Best Practice:** Use the same OAuth client for both production and staging, but with different redirect URIs:

**Production redirect URIs:**

- `https://nextbestmove.app/auth/callback`
- `https://nextbestmove.app/api/calendar/callback/google`

**Staging redirect URIs:**

- `https://staging.nextbestmove.app/auth/callback`
- `https://staging.nextbestmove.app/api/calendar/callback/google`

**Alternative:** Create separate OAuth clients for staging (if you prefer isolation).

---

## Quick Checklist

- [ ] Added `https://staging.nextbestmove.app/auth/callback` to Google Cloud Console
- [ ] Added `https://staging.nextbestmove.app/api/calendar/callback/google` to Google Cloud Console
- [ ] Added `https://staging.nextbestmove.app` to Authorized JavaScript origins
- [ ] Verified `GOOGLE_CLIENT_ID` in Vercel (Preview scope)
- [ ] Verified `GOOGLE_CLIENT_SECRET` in Vercel (Preview scope)
- [ ] Saved changes in Google Cloud Console
- [ ] Waited 1-2 minutes for propagation
- [ ] Tested OAuth sign-in
- [ ] Tested calendar connection

---

**After completing these steps, Google OAuth should work on staging!** ✅
