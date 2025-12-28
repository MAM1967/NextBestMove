# Production Google OAuth Diagnosis

## Current Status
- Error: `redirect_uri_mismatch` for `https://nextbestmove.app/api/calendar/callback/google`
- Redirect URI appears to be configured in Google Cloud Console
- Need to verify production client ID and configuration

---

## Step 1: Verify Production Client ID

The production "NextBestMove" client should have:
- **Client ID:** `732850218816-5eenvpldj6cd3i1abv18s8udqqs6s9gk.apps.googleusercontent.com`
- **Starts with:** `732850218816-5een...`

**Check in Google Cloud Console:**
1. Go to **APIs & Services** → **Credentials**
2. Find **"NextBestMove"** client (NOT "NextBestMove-Test")
3. Verify Client ID matches above

---

## Step 2: Verify Redirect URIs in Google Cloud Console

**For "NextBestMove" client, ensure these are EXACTLY:**

### Authorized Redirect URIs:
1. `https://nextbestmove.app/api/calendar/callback/google`
2. `https://nextbestmove.app/auth/callback`

### Authorized JavaScript Origins:
1. `https://nextbestmove.app`

**Common Mistakes:**
- ❌ `http://nextbestmove.app` (should be `https://`)
- ❌ `https://nextbestmove.app/` (trailing slash)
- ❌ `https://www.nextbestmove.app` (wrong subdomain)
- ❌ Typo in domain name

---

## Step 3: Verify Vercel Production Environment Variables

1. **Go to Vercel Dashboard:**
   - Settings → Environment Variables
   - Filter by **Production** scope (NOT Preview)

2. **Check `GOOGLE_CLIENT_ID`:**
   - Should be: `732850218816-5eenvpldj6cd3i1abv18s8udqqs6s9gk.apps.googleusercontent.com`
   - Should start with: `732850218816-5een...`
   - If it starts with `732850218816-kgrh...`, that's the STAGING client (wrong!)

3. **Check `GOOGLE_CLIENT_SECRET`:**
   - Should match "NextBestMove" client secret
   - Not the "NextBestMove-Test" secret

---

## Step 4: Test Production Debug Endpoint

After merging staging → main and deploying to production:

Visit: `https://nextbestmove.app/api/debug-oauth`

**Expected output:**
```json
{
  "isProduction": true,
  "googleClientIdPrefix": "732850218816-5een",
  "isProductionClient": true,
  "clientIdMatchesEnvironment": true,
  "recommendation": "Configuration looks correct"
}
```

**If wrong:**
- `isProductionClient: false` → Wrong client ID in Vercel
- `clientIdMatchesEnvironment: false` → Client ID doesn't match environment

---

## Step 5: Common Production Issues

### Issue 1: Using Staging Client in Production
**Symptom:** `GOOGLE_CLIENT_ID` in Vercel (Production scope) starts with `732850218816-kgrh...`

**Fix:**
- Update to production client ID: `732850218816-5eenvpldj6cd3i1abv18s8udqqs6s9gk.apps.googleusercontent.com`

### Issue 2: Redirect URI Not Added
**Symptom:** URI configured in code but missing from Google Cloud Console

**Fix:**
- Add `https://nextbestmove.app/api/calendar/callback/google` to "NextBestMove" client
- Wait 1-2 minutes
- Try again

### Issue 3: Editing Wrong Client
**Symptom:** Added redirect URI to "NextBestMove-Test" instead of "NextBestMove"

**Fix:**
- Make sure you're editing **"NextBestMove"** client (production)
- NOT "NextBestMove-Test" (that's staging)

### Issue 4: Typo in Redirect URI
**Symptom:** URI in error doesn't exactly match console

**Fix:**
- Copy the exact URI from the error message
- Compare character-by-character with Google Cloud Console
- Check for http vs https, trailing slashes, etc.

---

## Quick Fix Checklist

**Google Cloud Console:**
- [ ] Editing "NextBestMove" client (production)
- [ ] Client ID starts with `732850218816-5een...`
- [ ] Redirect URI: `https://nextbestmove.app/api/calendar/callback/google` added
- [ ] Redirect URI: `https://nextbestmove.app/auth/callback` added
- [ ] JavaScript origin: `https://nextbestmove.app` added
- [ ] No trailing slashes
- [ ] Saved changes

**Vercel:**
- [ ] `GOOGLE_CLIENT_ID` in Production scope = `732850218816-5een...`
- [ ] `GOOGLE_CLIENT_SECRET` in Production scope = "NextBestMove" secret
- [ ] NOT using staging client IDs

**Testing:**
- [ ] Waited 1-2 minutes after Google Cloud Console changes
- [ ] Tested OAuth connection
- [ ] Checked debug endpoint (after deployment)

---

## Next Steps

1. **Verify Google Cloud Console** - Ensure redirect URIs are added to "NextBestMove" client
2. **Verify Vercel** - Ensure Production scope has correct client ID
3. **Test** - Try connecting Google Calendar again
4. **Check Debug Endpoint** - After next production deployment, check `/api/debug-oauth`










