# Google OAuth New Client Setup Checklist

**New Client ID:** `[REDACTED - Check Google Cloud Console]`  
**Created:** January 2025  
**Status:** ✅ Credentials verified

---

## ✅ Completed Steps

- [x] Created new OAuth client in Google Cloud Console
- [x] Updated Vercel environment variables (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
- [x] Updated GitHub Secrets (for auto-sync)
- [x] Updated `.env.local` (local development)
- [x] Redeployed Vercel application
- [x] Verified credentials are valid (test script passed)

---

## ⚠️ Required: Configure Redirect URIs

**CRITICAL:** The new OAuth client must have the redirect URIs configured in Google Cloud Console.

### Steps:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth client (check Vercel environment variables for the client ID)
3. Click to **edit** the client
4. In **"Authorized redirect URIs"**, add:
   - `https://nextbestmove.app/api/calendar/callback/google` (production)
   - `http://localhost:3000/api/calendar/callback/google` (local development)
5. Click **SAVE**
6. Wait 1-2 minutes for changes to propagate

**Without these redirect URIs, you'll get "invalid_client" errors!**

---

## ⚠️ Required: Configure OAuth Consent Screen

### If in Testing Mode:

1. Go to [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
2. Scroll to **"Test users"** section
3. Click **"+ ADD USERS"**
4. Add: `mcddsl@gmail.com` (and any other test accounts)
5. Click **SAVE**

**Without test users, authentication will fail even with correct credentials!**

---

## Verification Checklist

Before testing the calendar connection:

- [ ] Redirect URIs added to OAuth client (see above)
- [ ] OAuth consent screen has test user `mcddsl@gmail.com` (if in Testing mode)
- [ ] OAuth client is **enabled** (not disabled)
- [ ] Application type is "Web application"
- [ ] Vercel environment variables updated and app redeployed
- [ ] GitHub Secrets updated (for future syncs)
- [ ] `.env.local` updated (for local development)
- [ ] Wait 1-2 minutes after saving redirect URIs

---

## Test the Connection

1. Go to your app → Settings → Calendar
2. Click **"Disconnect"** if there's an existing connection
3. Click **"Connect Google"**
4. You should see:
   - Account picker (thanks to `select_account` prompt)
   - `mcddsl@gmail.com` as an option
   - No "invalid_client" error
5. Select `mcddsl@gmail.com` and authorize
6. Should redirect back to settings with "Calendar connected"

---

## Environment Variables Reference

**Vercel Production:**
```
GOOGLE_CLIENT_ID=[Your client ID from Google Cloud Console]
GOOGLE_CLIENT_SECRET=[Your client secret from Google Cloud Console]
```

**Local Development (.env.local):**
```
GOOGLE_CLIENT_ID=[Your client ID from Google Cloud Console]
GOOGLE_CLIENT_SECRET=[Your client secret from Google Cloud Console]
```

**GitHub Secrets:**
- `GOOGLE_CLIENT_ID` = [Your client ID from Google Cloud Console]
- `GOOGLE_CLIENT_SECRET` = [Your client secret from Google Cloud Console]

---

## Troubleshooting

### Still getting "invalid_client" error?

1. **Check redirect URI is added:**
   - Go to Google Cloud Console → Credentials → Your OAuth client
   - Verify `https://nextbestmove.app/api/calendar/callback/google` is in the list
   - Must match exactly (case-sensitive, no trailing slash)

2. **Check OAuth client is enabled:**
   - In credentials list, ensure status shows "Enabled"
   - If disabled, enable it

3. **Verify environment variables:**
   - Check Vercel Dashboard → Settings → Environment Variables
   - Ensure `GOOGLE_CLIENT_ID` matches the new client ID
   - If different, update and redeploy

4. **Wait for propagation:**
   - Changes in Google Cloud Console can take 1-2 minutes
   - Try again after waiting

### Test user not showing in account picker?

1. Check OAuth consent screen → Test users
2. Ensure `mcddsl@gmail.com` is added
3. If in Production mode, test users aren't needed (but app must be verified)

---

## Old Client (Deprecated)

**Old Client ID:** `732850218816-6b8ft52uum9dh2m18uk86jo4o8dk96cm.apps.googleusercontent.com`  
**Status:** ❌ Replaced with new client  
**Action:** Can be deleted from Google Cloud Console if no longer needed

---

_Last updated: January 2025_

