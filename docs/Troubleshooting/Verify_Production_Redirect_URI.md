# Verify Production Redirect URI Configuration

## Critical: Google OAuth Redirect URI Must Match Exactly

When you see Google's "Something went wrong" error, it's almost always a redirect URI mismatch.

---

## Step 1: Check What Redirect URI is Being Sent

After deployment, check Vercel logs for:
```
[Calendar Connect] google - Full OAuth Configuration:
```

Look for the `redirectUri` value. It should be:
```
https://nextbestmove.app/api/calendar/callback/google
```

**CRITICAL:** Check for:
- ❌ Trailing slash: `https://nextbestmove.app/api/calendar/callback/google/`
- ❌ Wrong domain: `https://www.nextbestmove.app/...` or `http://...`
- ❌ Wrong path: `/api/calendar/callback/google` (missing domain)

---

## Step 2: Verify Google Cloud Console

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/apis/credentials
   - Select project: Your production project

2. **Find "NextBestMove" OAuth Client** (NOT "NextBestMove-Test")
   - Client ID should start with: `732850218816-5een...`

3. **Click Edit** on the "NextBestMove" client

4. **Check "Authorized redirect URIs":**
   
   Must have EXACTLY (copy/paste these):
   ```
   https://nextbestmove.app/api/calendar/callback/google
   https://nextbestmove.app/auth/callback
   ```

5. **Check "Authorized JavaScript origins":**
   
   Must have:
   ```
   https://nextbestmove.app
   ```

---

## Step 3: Common Issues

### Issue 1: Redirect URI Not Added
**Symptom:** Error page appears immediately

**Fix:**
- Add the redirect URI to Google Cloud Console
- Wait 1-2 minutes for changes to propagate
- Try again

### Issue 2: Trailing Slash
**Symptom:** URI almost matches but has `/` at end

**Fix:**
- Remove trailing slash in Google Cloud Console
- Ensure code doesn't add trailing slash (check `redirectUri` construction)

### Issue 3: Using Wrong OAuth Client
**Symptom:** Added URI to "NextBestMove-Test" instead of "NextBestMove"

**Fix:**
- Make sure you're editing "NextBestMove" client (production)
- Client ID should start with `732850218816-5een...`

### Issue 4: HTTP vs HTTPS
**Symptom:** Using `http://` instead of `https://`

**Fix:**
- Production MUST use `https://`
- Check Google Cloud Console has `https://`
- Check Vercel is serving over HTTPS

---

## Step 4: Test Configuration

1. **Deploy latest code** with enhanced logging
2. **Check Vercel logs** for redirect URI being sent
3. **Compare** with Google Cloud Console
4. **Verify** character-by-character match (no spaces, exact case)

---

## Expected Redirect URI for Production

```
https://nextbestmove.app/api/calendar/callback/google
```

- Protocol: `https://` (required)
- Domain: `nextbestmove.app` (no `www.`)
- Path: `/api/calendar/callback/google` (exact path)
- No trailing slash
- No query parameters in the redirect URI itself

---

## Quick Checklist

- [ ] Redirect URI in code: `https://nextbestmove.app/api/calendar/callback/google`
- [ ] Redirect URI in Google Cloud Console: `https://nextbestmove.app/api/calendar/callback/google`
- [ ] Editing "NextBestMove" client (not "NextBestMove-Test")
- [ ] Client ID starts with `732850218816-5een...`
- [ ] No trailing slashes
- [ ] Using `https://` not `http://`
- [ ] No `www.` subdomain
- [ ] Waited 1-2 minutes after Google Cloud Console changes
- [ ] Checked Vercel logs for actual redirect URI being sent

