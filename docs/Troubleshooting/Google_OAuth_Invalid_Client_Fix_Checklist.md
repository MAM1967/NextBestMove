# Google OAuth "Invalid Client" - Fix Checklist

**Error:** `Error 401: invalid_client - The OAuth client was not found`  
**Symptom:** Wrong account showing (`michaeltestmcdermott@gmail.com` instead of `mcddsl@gmail.com`)

---

## Root Cause

The "invalid_client" error means Google cannot find or recognize the OAuth client. This happens **before** the account picker is shown, which is why you're seeing the wrong account - Google is rejecting the request entirely.

---

## Critical Checks (Do These First)

### ✅ Check 1: Redirect URI in Google Cloud Console

**This is the #1 cause of "invalid_client" errors.**

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth client (check Vercel for the client ID)
3. Click to **edit** the client
4. In **"Authorized redirect URIs"**, verify these are **EXACTLY** present:
   - `https://nextbestmove.app/api/calendar/callback/google` (production)
   - `http://localhost:3000/api/calendar/callback/google` (local, if testing locally)

**Critical:**
- Must match **EXACTLY** (case-sensitive)
- No trailing slashes
- Must include the full path `/api/calendar/callback/google`

5. Click **SAVE**
6. Wait 1-2 minutes for changes to propagate

---

### ✅ Check 2: OAuth Client ID Matches

1. **Get client ID from Vercel:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Find `GOOGLE_CLIENT_ID`
   - Copy the value

2. **Verify in Google Cloud Console:**
   - Go to Google Cloud Console → Credentials
   - Find the OAuth client
   - Verify the Client ID matches **EXACTLY** (including the `.apps.googleusercontent.com` suffix)

3. **If they don't match:**
   - Update Vercel with the correct client ID from Google Cloud Console
   - OR update Google Cloud Console with the client ID from Vercel
   - Redeploy Vercel after updating

---

### ✅ Check 3: OAuth Client Secret Matches

1. **Get client secret from Vercel:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Find `GOOGLE_CLIENT_SECRET`
   - Note: You can't see the value, but verify it exists

2. **Verify in Google Cloud Console:**
   - Go to Google Cloud Console → Credentials
   - Find the OAuth client
   - Click to view the client secret
   - If you need to reset it, click "Reset secret" and update Vercel

3. **If secret doesn't match:**
   - Reset the secret in Google Cloud Console
   - Update `GOOGLE_CLIENT_SECRET` in Vercel
   - Redeploy Vercel

---

### ✅ Check 4: OAuth Client Status

1. In Google Cloud Console → Credentials
2. Find your OAuth client
3. Verify:
   - Status shows **"Enabled"** (not disabled)
   - Application type is **"Web application"**
   - Client ID and Secret are both present

---

### ✅ Check 5: OAuth Consent Screen - Test Users

**If your OAuth consent screen is in "Testing" mode:**

1. Go to [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
2. Scroll to **"Test users"** section
3. Verify `mcddsl@gmail.com` is in the list
4. If not, click **"+ ADD USERS"** and add it
5. Click **SAVE**

**Note:** In Testing mode, only test users can authenticate. If `mcddsl@gmail.com` isn't in the list, Google will reject the request.

---

## Step-by-Step Fix

### Step 1: Verify Redirect URI

1. Go to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Check "Authorized redirect URIs"
4. Add if missing: `https://nextbestmove.app/api/calendar/callback/google`
5. Save

### Step 2: Verify Client ID/Secret Match

1. Compare `GOOGLE_CLIENT_ID` in Vercel with Client ID in Google Cloud Console
2. If different, update Vercel to match Google Cloud Console
3. Redeploy Vercel

### Step 3: Add Test User (If in Testing Mode)

1. Go to OAuth consent screen
2. Add `mcddsl@gmail.com` to test users
3. Save

### Step 4: Wait and Test

1. Wait 1-2 minutes after making changes
2. Clear browser cookies for `accounts.google.com` (or use incognito)
3. Try connecting calendar again
4. You should see the account picker with `mcddsl@gmail.com`

---

## Why Wrong Account Shows

When Google returns "invalid_client", it happens **before** the account picker is shown. The error page you see is Google's default error page, which may show a cached account from a previous session. This is why you see `michaeltestmcdermott@gmail.com` even though you're trying to sign in with `mcddsl@gmail.com`.

**The fix:** Once the redirect URI and client credentials are correct, Google will show the account picker, and you can select `mcddsl@gmail.com`.

---

## Verification

After fixing the above:

1. ✅ Redirect URI is in Google Cloud Console
2. ✅ Client ID matches between Vercel and Google Cloud Console
3. ✅ Client secret is set in Vercel
4. ✅ OAuth client is enabled
5. ✅ Test user `mcddsl@gmail.com` is added (if in Testing mode)
6. ✅ Wait 1-2 minutes
7. ✅ Try connecting calendar
8. ✅ Should see account picker (not error page)
9. ✅ Can select `mcddsl@gmail.com`
10. ✅ Connection succeeds

---

## Still Not Working?

If you've verified all the above and it's still not working:

1. **Check Vercel logs** for the exact error message
2. **Check browser console** for any additional errors
3. **Try in incognito window** to rule out browser cache
4. **Verify the authorization URL** being generated:
   - Check Vercel function logs for `/api/calendar/connect/google`
   - Look for the authorization URL
   - Verify it includes the correct `client_id` and `redirect_uri`

---

_Last updated: January 2025_

