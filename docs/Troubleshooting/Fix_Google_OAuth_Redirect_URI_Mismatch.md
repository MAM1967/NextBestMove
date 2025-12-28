# Fix Google OAuth Redirect URI Mismatch

## Problem
Getting `Error 400: redirect_uri_mismatch` when trying to connect Google Calendar.

**Error Message:**
```
redirect_uri=https://nextbestmove.app/api/calendar/callback/google
```

---

## Root Cause Analysis

The redirect URI is constructed dynamically from `request.nextUrl.origin`. The most common causes are:

1. **Wrong OAuth Client ID** - Using staging client ID in production (or vice versa)
2. **Redirect URI not in Google Cloud Console** - URI exists but not added to the correct client
3. **Typo in redirect URI** - Extra characters, wrong domain, etc.
4. **Environment variable mismatch** - Client ID in Vercel doesn't match Google Cloud Console

---

## Step 1: Check Which Client ID is Being Used

After the next deployment, visit:

**Production:**
```
https://nextbestmove.app/api/debug-oauth
```

**Staging:**
```
https://staging.nextbestmove.app/api/debug-oauth
```

This will show:
- Which `GOOGLE_CLIENT_ID` is being used
- Whether it matches the expected client for the environment
- The redirect URI being constructed

---

## Step 2: Verify Google Cloud Console Configuration

### For Production (`nextbestmove.app`):

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/
   - Select your project
   - Go to **APIs & Services** → **Credentials**

2. **Find "NextBestMove" client** (Production):
   - Client ID should start with: `732850218816-5een...`
   - Click to edit

3. **Verify Authorized Redirect URIs:**
   - Must include: `https://nextbestmove.app/api/calendar/callback/google`
   - Must include: `https://nextbestmove.app/auth/callback`
   - No trailing slashes
   - Exact match (case-sensitive)

4. **Verify Authorized JavaScript Origins:**
   - Must include: `https://nextbestmove.app`
   - No trailing slashes

### For Staging (`staging.nextbestmove.app`):

1. **Find "NextBestMove-Test" client** (Staging):
   - Client ID should start with: `732850218816-kgrh...`
   - Click to edit

2. **Verify Authorized Redirect URIs:**
   - Must include: `https://staging.nextbestmove.app/api/calendar/callback/google`
   - Must include: `https://staging.nextbestmove.app/auth/callback`
   - No trailing slashes

3. **Verify Authorized JavaScript Origins:**
   - Must include: `https://staging.nextbestmove.app`

---

## Step 3: Verify Vercel Environment Variables

### Production Environment (Production Scope):

1. **Go to Vercel Dashboard:**
   - Your Project → **Settings** → **Environment Variables**
   - Filter by **Production** scope

2. **Verify:**
   - `GOOGLE_CLIENT_ID` = `732850218816-5eenvpldj6cd3i1abv18s8udqqs6s9gk.apps.googleusercontent.com`
   - `GOOGLE_CLIENT_SECRET` = (matches NextBestMove client secret)

### Staging Environment (Preview Scope):

1. **Filter by Preview scope**

2. **Verify:**
   - `GOOGLE_CLIENT_ID` = `732850218816-kgrh...` (NextBestMove-Test client)
   - `GOOGLE_CLIENT_SECRET` = (matches NextBestMove-Test client secret)

---

## Step 4: Common Issues and Fixes

### Issue 1: Wrong Client ID in Environment

**Symptom:** Debug endpoint shows wrong client ID prefix

**Fix:**
- Update `GOOGLE_CLIENT_ID` in Vercel to match the correct client
- Production: Use "NextBestMove" client
- Staging: Use "NextBestMove-Test" client

### Issue 2: Redirect URI Not Added

**Symptom:** URI exists in code but not in Google Cloud Console

**Fix:**
- Add the exact redirect URI to Google Cloud Console
- Wait 1-2 minutes for changes to propagate
- Try again

### Issue 3: Typo in Redirect URI

**Symptom:** URI in error doesn't match console

**Fix:**
- Check for typos (http vs https, trailing slashes, etc.)
- Ensure exact match in Google Cloud Console

### Issue 4: Using Staging Client in Production

**Symptom:** Production using NextBestMove-Test client ID

**Fix:**
- Update `GOOGLE_CLIENT_ID` in Vercel Production scope
- Use "NextBestMove" client ID (starts with `732850218816-5een`)

---

## Step 5: Test After Fix

1. **Wait 1-2 minutes** after making changes in Google Cloud Console

2. **Test OAuth:**
   - Sign in to the app
   - Go to Settings → Calendar
   - Click "Connect Google Calendar"
   - Should redirect to Google OAuth consent screen
   - After consent, should redirect back successfully

3. **Check Debug Endpoint:**
   - Visit `/api/debug-oauth`
   - Verify `clientIdMatchesEnvironment: true`
   - Verify `recommendation: "Configuration looks correct"`

---

## Quick Checklist

**For Production:**
- [ ] Using "NextBestMove" client (ID starts with `732850218816-5een`)
- [ ] Redirect URI: `https://nextbestmove.app/api/calendar/callback/google` added
- [ ] Redirect URI: `https://nextbestmove.app/auth/callback` added
- [ ] JavaScript origin: `https://nextbestmove.app` added
- [ ] `GOOGLE_CLIENT_ID` in Vercel (Production scope) matches
- [ ] `GOOGLE_CLIENT_SECRET` in Vercel (Production scope) matches

**For Staging:**
- [ ] Using "NextBestMove-Test" client (ID starts with `732850218816-kgrh`)
- [ ] Redirect URI: `https://staging.nextbestmove.app/api/calendar/callback/google` added
- [ ] Redirect URI: `https://staging.nextbestmove.app/auth/callback` added
- [ ] JavaScript origin: `https://staging.nextbestmove.app` added
- [ ] `GOOGLE_CLIENT_ID` in Vercel (Preview scope) matches
- [ ] `GOOGLE_CLIENT_SECRET` in Vercel (Preview scope) matches

---

## Still Not Working?

1. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Deployments → Functions
   - Find `/api/calendar/connect/google`
   - Check logs for the actual client ID and redirect URI being used

2. **Verify No Typos:**
   - Copy-paste the redirect URI from the error message
   - Compare character-by-character with Google Cloud Console
   - Check for hidden characters or encoding issues

3. **Clear Browser Cache:**
   - Sometimes OAuth errors are cached
   - Try incognito/private browsing mode

4. **Check for Multiple Clients:**
   - Ensure you're editing the correct client in Google Cloud Console
   - Production: "NextBestMove"
   - Staging: "NextBestMove-Test"










