# Fix Production Google OAuth Redirect URI Mismatch

## Problem

Production Google OAuth shows `Error 400: redirect_uri_mismatch` when connecting calendar.

**Error:**

```
redirect_uri=https://nextbestmove.app/api/calendar/callback/google
```

---

## Step 1: Verify Google Cloud Console Configuration

### For "NextBestMove" Client (Production):

1. **Go to Google Cloud Console:**

   - https://console.cloud.google.com/
   - Select your project
   - Go to **APIs & Services** → **Credentials**
   - Find **"NextBestMove"** client (NOT "NextBestMove-Test")
   - Client ID should start with: `732850218816-5een...`

2. **Verify Authorized Redirect URIs:**

   - Must include: `https://nextbestmove.app/api/calendar/callback/google`
   - Must include: `https://nextbestmove.app/auth/callback`
   - No trailing slashes
   - Exact match (case-sensitive, no typos)

3. **Verify Authorized JavaScript Origins:**

   - Must include: `https://nextbestmove.app`
   - No trailing slashes

4. **If missing, add them:**
   - Click **+ ADD URI** for each redirect URI
   - Click **+ ADD URI** for JavaScript origin
   - Click **SAVE**
   - Wait 1-2 minutes for changes to propagate

---

## Step 2: Verify Vercel Production Environment Variables

1. **Go to Vercel Dashboard:**

   - Your Project → **Settings** → **Environment Variables**
   - Filter by **Production** scope (NOT Preview)

2. **Verify `GOOGLE_CLIENT_ID`:**

   - Should be: `732850218816-5eenvpldj6cd3i1abv18s8udqqs6s9gk.apps.googleusercontent.com`
   - Should start with: `732850218816-5een...`
   - If wrong, update it

3. **Verify `GOOGLE_CLIENT_SECRET`:**
   - Should match "NextBestMove" client secret from Google Cloud Console
   - If wrong, update it

---

## Step 3: Check for Common Issues

### Issue 1: Redirect URI Not Added

**Symptom:** URI exists in code but not in Google Cloud Console

**Fix:**

- Add `https://nextbestmove.app/api/calendar/callback/google` to "NextBestMove" client
- Wait 1-2 minutes
- Try again

### Issue 2: Wrong Client ID in Vercel

**Symptom:** Using staging client ID in production

**Fix:**

- Update `GOOGLE_CLIENT_ID` in Vercel (Production scope)
- Use "NextBestMove" client ID (starts with `732850218816-5een`)

### Issue 3: Typo in Redirect URI

**Symptom:** URI in error doesn't exactly match console

**Fix:**

- Check for typos (http vs https, trailing slashes, etc.)
- Ensure exact match in Google Cloud Console

### Issue 4: Using Wrong Client

**Symptom:** Editing "NextBestMove-Test" instead of "NextBestMove"

**Fix:**

- Make sure you're editing the **"NextBestMove"** client (production)
- NOT "NextBestMove-Test" (that's for staging)

---

## Step 4: Test After Fix

1. **Wait 1-2 minutes** after making changes in Google Cloud Console

2. **Test Production OAuth:**

   - Visit: `https://nextbestmove.app`
   - Sign in
   - Go to Settings → Calendar
   - Click "Connect Google Calendar"
   - Should redirect to Google OAuth consent screen
   - After consent, should redirect back successfully

3. **Check Vercel Logs (if still failing):**
   - Vercel Dashboard → Deployments → Functions
   - Find `/api/calendar/connect/google`
   - Check logs for the actual client ID and redirect URI being used

---

## Quick Checklist

**For Production:**

- [ ] Using "NextBestMove" client (ID starts with `732850218816-5een`)
- [ ] Redirect URI: `https://nextbestmove.app/api/calendar/callback/google` added
- [ ] Redirect URI: `https://nextbestmove.app/auth/callback` added
- [ ] JavaScript origin: `https://nextbestmove.app` added
- [ ] `GOOGLE_CLIENT_ID` in Vercel (Production scope) = `732850218816-5een...`
- [ ] `GOOGLE_CLIENT_SECRET` in Vercel (Production scope) matches "NextBestMove" client
- [ ] Changes saved in Google Cloud Console
- [ ] Waited 1-2 minutes for propagation
- [ ] Tested and works

---

## Still Not Working?

1. **Check the exact redirect URI in the error:**

   - Copy it exactly from the error message
   - Compare character-by-character with Google Cloud Console
   - Look for hidden characters or encoding issues

2. **Verify you're editing the correct client:**

   - Production: "NextBestMove" (starts with `732850218816-5een`)
   - Staging: "NextBestMove-Test" (starts with `732850218816-kgrh`)

3. **Check Vercel environment variable scope:**

   - Production OAuth needs Production scope
   - Preview OAuth needs Preview scope
   - Don't mix them up

4. **Try clearing browser cache:**
   - Sometimes OAuth errors are cached
   - Use incognito/private browsing mode









