# Production OAuth Quick Fix

## Step 1: Wait for Production Deployment

The debug endpoint has been merged to main. Wait 2-3 minutes for Vercel to deploy, then:

**Visit:** `https://nextbestmove.app/api/debug-oauth`

This will show you:
- The actual `GOOGLE_CLIENT_ID` being used
- Whether it matches production (`732850218816-5een...`)
- The expected redirect URI

---

## Step 2: Verify Google Cloud Console

### For "NextBestMove" Client (Production):

1. **Go to:** https://console.cloud.google.com/
2. **Navigate to:** APIs & Services → Credentials
3. **Find:** "NextBestMove" client (NOT "NextBestMove-Test")
4. **Client ID should be:** `732850218816-5eenvpldj6cd3i1abv18s8udqqs6s9gk.apps.googleusercontent.com`

### Authorized Redirect URIs (must include EXACTLY):

```
https://nextbestmove.app/api/calendar/callback/google
https://nextbestmove.app/auth/callback
```

**Common mistakes:**
- ❌ Missing one of the URIs
- ❌ `http://` instead of `https://`
- ❌ Trailing slash: `https://nextbestmove.app/...`
- ❌ `www.` subdomain: `https://www.nextbestmove.app/...`
- ❌ Typo in domain name

### Authorized JavaScript Origins:

```
https://nextbestmove.app
```

**No trailing slash!**

---

## Step 3: Verify Vercel Production Environment Variables

1. **Go to:** Vercel Dashboard → Your Project → Settings → Environment Variables
2. **Filter by:** Production scope (NOT Preview)
3. **Check `GOOGLE_CLIENT_ID`:**
   - Should be: `732850218816-5eenvpldj6cd3i1abv18s8udqqs6s9gk.apps.googleusercontent.com`
   - Should start with: `732850218816-5een...`
   - If it starts with `732850218816-kgrh...`, that's WRONG (that's staging!)

4. **Check `GOOGLE_CLIENT_SECRET`:**
   - Should match "NextBestMove" client secret from Google Cloud Console

---

## Step 4: Test After Fix

1. **Wait 1-2 minutes** after making changes in Google Cloud Console
2. **Test OAuth:**
   - Visit: `https://nextbestmove.app`
   - Sign in
   - Go to Settings → Calendar
   - Click "Connect Google Calendar"
   - Should redirect to Google OAuth consent screen
   - After consent, should redirect back successfully

---

## Most Common Issues

### Issue 1: Redirect URI Not Added
**Fix:** Add `https://nextbestmove.app/api/calendar/callback/google` to "NextBestMove" client in Google Cloud Console

### Issue 2: Wrong Client ID in Vercel
**Fix:** Update `GOOGLE_CLIENT_ID` in Vercel (Production scope) to `732850218816-5eenvpldj6cd3i1abv18s8udqqs6s9gk.apps.googleusercontent.com`

### Issue 3: Editing Wrong Client
**Fix:** Make sure you're editing "NextBestMove" (production), NOT "NextBestMove-Test" (staging)

---

## Quick Checklist

- [ ] Debug endpoint deployed: `https://nextbestmove.app/api/debug-oauth` works
- [ ] Google Cloud Console: "NextBestMove" client has both redirect URIs
- [ ] Google Cloud Console: JavaScript origin is `https://nextbestmove.app` (no trailing slash)
- [ ] Vercel: `GOOGLE_CLIENT_ID` in Production scope = `732850218816-5een...`
- [ ] Vercel: `GOOGLE_CLIENT_SECRET` in Production scope = "NextBestMove" secret
- [ ] Waited 1-2 minutes after Google Cloud Console changes
- [ ] Tested OAuth connection - works!





