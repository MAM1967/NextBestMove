# Google OAuth "Invalid Client" - Quick Fix

**Error:** `Error 401: invalid_client - The OAuth client was not found`  
**Test Account:** `mcddsl@gmail.com`  
**Wrong Account Shown:** `michaeltestmcdermott@gmail.com`

---

## Most Likely Causes

1. **Redirect URI not configured** in Google Cloud Console
2. **Test user not added** to OAuth consent screen (if in Testing mode)
3. **Redirect URI mismatch** (typo, trailing slash, wrong domain)

---

## Quick Fix Steps

### Step 1: Verify Redirect URI in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID: `732850218816-6b8ft52uum9dh2m18uk86jo4o8dk96cm`
4. Click on it to edit
5. Check **Authorized redirect URIs** section

**Required URIs (add if missing):**
- `https://nextbestmove.app/api/calendar/callback/google` (production)
- `http://localhost:3000/api/calendar/callback/google` (local, if testing locally)

**Important:**
- Must match **EXACTLY** (case-sensitive)
- No trailing slashes
- Must include `/api/calendar/callback/google` (not just the domain)

6. Click **SAVE**

---

### Step 2: Add Test User to OAuth Consent Screen

**If your OAuth consent screen is in "Testing" mode:**

1. Go to **APIs & Services** → **OAuth consent screen**
2. Scroll to **Test users** section
3. Click **"+ ADD USERS"**
4. Add: `mcddsl@gmail.com`
5. Click **ADD**
6. Click **SAVE** at the bottom

**Why this matters:**
- In Testing mode, only test users can authenticate
- If `mcddsl@gmail.com` isn't in the list, Google will reject the request
- This can cause "invalid_client" error even if the client exists

---

### Step 3: Verify OAuth Consent Screen Status

1. In **OAuth consent screen**, check **Publishing status**
2. **If "Testing":**
   - ✅ Make sure `mcddsl@gmail.com` is in test users (Step 2)
   - ✅ This is fine for development
3. **If "In production":**
   - ✅ Should work for all users
   - ⚠️ Requires app verification (including video) if using sensitive scopes

**For now, "Testing" mode is fine** - just ensure test users are added.

---

### Step 4: Clear Browser Session

The wrong account (`michaeltestmcdermott@gmail.com`) might be cached:

1. **Option A: Use Incognito/Private Window**
   - Open a new incognito window
   - Navigate to your app
   - Try connecting calendar again

2. **Option B: Clear Google Cookies**
   - In your browser, clear cookies for `accounts.google.com`
   - Or use browser's "Clear site data" for Google

3. **Option C: Sign Out of Wrong Account**
   - Go to [Google Account](https://myaccount.google.com/)
   - Sign out of `michaeltestmcdermott@gmail.com`
   - Sign in with `mcddsl@gmail.com`
   - Then try connecting calendar

---

### Step 5: Try Connecting Again

After completing Steps 1-4:

1. Go to your app → Settings → Calendar
2. Click **"Disconnect"** if there's an existing connection
3. Click **"Connect Google"**
4. You should now see:
   - Account picker (thanks to `select_account` prompt)
   - `mcddsl@gmail.com` as an option
   - No "invalid_client" error

---

## Verification Checklist

- [ ] Redirect URI `https://nextbestmove.app/api/calendar/callback/google` is in Google Cloud Console
- [ ] Redirect URI matches exactly (no typos, no trailing slash)
- [ ] OAuth consent screen has `mcddsl@gmail.com` in test users (if in Testing mode)
- [ ] Browser session cleared or using incognito window
- [ ] Tried connecting calendar again
- [ ] Account picker shows `mcddsl@gmail.com`
- [ ] Connection succeeds without errors

---

## If Still Not Working

### Check Environment Variables

Verify the client ID in Vercel matches Google Cloud Console:

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Check `GOOGLE_CLIENT_ID` value
3. Should be: `732850218816-6b8ft52uum9dh2m18uk86jo4o8dk96cm.apps.googleusercontent.com`
4. If different, update it and redeploy

### Check OAuth Client Status

1. In Google Cloud Console → Credentials
2. Find your OAuth client
3. Verify it's **enabled** (not disabled)
4. Check **Application type** is "Web application"

### Test with curl

Run the diagnostic script to verify credentials:

```bash
cd /Users/michaelmcdermott/NextBestMove
./scripts/test-google-oauth-client.sh
```

This will verify:
- Client ID/secret are correct
- Authorization endpoint accepts the client
- Token endpoint recognizes the credentials

---

## Console Errors (Can Ignore)

The console errors about `play.google.com/log` are **not related** to the OAuth issue. They're Google's analytics/logging being blocked by CORS or content blockers. You can ignore them.

---

_Last updated: January 2025_

