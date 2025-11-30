# Google OAuth Client Not Found - Fix Guide

**Error:** `invalid_client - The OAuth client was not found`  
**Client ID from error:** `732850218816-6b8ft52uum9dh2m18uk86jo4o8dk96cm.apps.googleusercontent.com`

---

## Quick Diagnosis

This error occurs when:
1. The OAuth client was deleted in Google Cloud Console
2. The OAuth client was disabled
3. You switched between testing/production and the client ID changed
4. Environment variables don't match the OAuth client

---

## Step-by-Step Fix

### Step 1: Check Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one if needed)
3. Navigate to **APIs & Services** → **Credentials**
4. Look for OAuth 2.0 Client IDs
5. Check if client ID `732850218816-6b8ft52uum9dh2m18uk86jo4o8dk96cm` exists

**If the client exists:**
- ✅ Verify it's **enabled** (not disabled)
- ✅ Check **Authorized redirect URIs** include **EXACTLY** (case-sensitive, no trailing slashes):
  - `https://nextbestmove.app/api/calendar/callback/google` (production)
  - `http://localhost:3000/api/calendar/callback/google` (local development)
- ✅ Verify **Application type** is "Web application"
- ✅ **CRITICAL:** Check OAuth consent screen:
  - If in **Testing** mode, ensure `mcddsl@gmail.com` is added to **Test users** list
  - If in **Production** mode, ensure app is published (or use Testing mode for now)

**If the client doesn't exist:**
- You'll need to create a new one (see Step 2)

---

### Step 2: Create/Verify OAuth Client

#### Option A: Use Existing Client (If Found)

1. Click on the OAuth client in Google Cloud Console
2. Copy the **Client ID** and **Client Secret**
3. Update your environment variables (see Step 3)

#### Option B: Create New OAuth Client

1. In Google Cloud Console → **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. If prompted, configure OAuth consent screen first:
   - **User Type:** External (unless you have Google Workspace)
   - **App name:** NextBestMove
   - **User support email:** Your email
   - **Developer contact:** Your email
   - **Scopes:** Add `https://www.googleapis.com/auth/calendar.readonly`
   - **Publishing status:** Set to **Testing** (for now)
   - **Test users:** **REQUIRED if in Testing mode** - Add `mcddsl@gmail.com` and any other test accounts
4. Create OAuth client:
   - **Application type:** Web application
   - **Name:** NextBestMove Calendar Integration
   - **Authorized redirect URIs:**
     - `https://nextbestmove.app/api/calendar/callback/google`
     - `http://localhost:3000/api/calendar/callback/google`
5. Click **"CREATE"**
6. **Copy the Client ID and Client Secret** (you'll need these)

---

### Step 3: Update Environment Variables

#### Local Development (.env.local)

```bash
# Update these values
GOOGLE_CLIENT_ID=your-new-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-new-client-secret
```

**Important:** Remove any trailing newlines or spaces!

#### Vercel Production

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Find `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
3. Click **"Edit"** on each
4. Update with the new values from Google Cloud Console
5. **Redeploy** the application (or wait for next deploy)

#### GitHub Secrets (For Auto-Sync)

1. Go to GitHub → Repository → **Settings** → **Secrets and variables** → **Actions**
2. Find `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
3. Click **"Update"** and paste new values
4. Trigger the sync workflow (or it will sync on next push)

---

### Step 4: Reconnect Calendar

After updating environment variables:

1. **Disconnect existing calendar:**
   - Go to Settings → Calendar
   - Click "Disconnect" for Google Calendar

2. **Reconnect calendar:**
   - Click "Connect Google"
   - Complete OAuth flow
   - This will create a new refresh token with the correct OAuth client

3. **Verify it works:**
   - Check Settings → Calendar shows "Connected"
   - Last sync time should update
   - No error messages

---

## Testing vs Production OAuth Clients

### Google OAuth App Publishing Status

When you switch between **Testing** and **Production** in Google Cloud Console:

- **Testing Mode:**
  - Only test users can authenticate
  - No video required
  - OAuth client still works, but limited to test users

- **Production Mode:**
  - Requires verification (including video)
  - Available to all users
  - OAuth client ID/secret don't change

**Important:** The OAuth client ID/secret don't change when switching modes. If you're getting "client not found", the client was likely deleted or the credentials are wrong.

---

## Verification Checklist

- [ ] OAuth client exists in Google Cloud Console
- [ ] OAuth client is enabled (not disabled)
- [ ] Redirect URIs are correct
- [ ] `GOOGLE_CLIENT_ID` matches the client ID in Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` matches the client secret in Google Cloud Console
- [ ] Environment variables updated in Vercel
- [ ] Application redeployed after updating variables
- [ ] Calendar disconnected and reconnected
- [ ] Calendar connection works without errors

---

## Common Issues

### Issue: "OAuth client was not found" - Redirect URI Mismatch

**Symptoms:**
- Error 401: invalid_client
- OAuth client exists and is enabled
- Client ID/secret are correct

**Cause:** The redirect URI in the OAuth request doesn't match what's configured in Google Cloud Console.

**Fix:**
1. Check what redirect URI your app is sending:
   - Production: `https://nextbestmove.app/api/calendar/callback/google`
   - Local: `http://localhost:3000/api/calendar/callback/google`
2. In Google Cloud Console → OAuth client → **Authorized redirect URIs**:
   - Ensure the URI matches **EXACTLY** (case-sensitive, no trailing slash)
   - Add both production and local URIs if testing both
3. Save changes and wait 1-2 minutes for propagation
4. Try connecting again

### Issue: "OAuth client was not found" - Test User Not Added

**Symptoms:**
- Error 401: invalid_client
- OAuth consent screen is in **Testing** mode
- Trying to authenticate with an account not in test users list

**Cause:** OAuth consent screen is in Testing mode, but the account (`mcddsl@gmail.com`) is not added as a test user.

**Fix:**
1. Go to Google Cloud Console → **APIs & Services** → **OAuth consent screen**
2. Scroll to **Test users** section
3. Click **"+ ADD USERS"**
4. Add `mcddsl@gmail.com` (and any other test accounts)
5. Save changes
6. Try connecting again - you should now see the account picker and be able to select `mcddsl@gmail.com`

### Issue: "OAuth client was not found" after switching to testing

**Cause:** The OAuth client might have been deleted or disabled when switching modes.

**Fix:**
1. Check if client still exists in Google Cloud Console
2. If deleted, create a new one
3. Update environment variables
4. Reconnect calendar

### Issue: Environment variables updated but still getting error

**Possible causes:**
1. Application not redeployed (Vercel needs redeploy to pick up new env vars)
2. Cached values in browser
3. Wrong environment (checking production but updated local)

**Fix:**
1. **Redeploy Vercel application:**
   - Go to Vercel Dashboard → Deployments
   - Click "Redeploy" on latest deployment
   - Or push a new commit to trigger deploy

2. **Clear browser cache:**
   - Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
   - Or clear cache and cookies

3. **Verify environment:**
   - Check you're testing on the correct environment
   - Local uses `.env.local`
   - Production uses Vercel environment variables

### Issue: Multiple OAuth clients, which one to use?

**Best practice:**
- Use **one OAuth client per environment**
- **Development:** One client for `localhost:3000`
- **Production:** One client for `nextbestmove.app`

**To identify which client:**
1. Check the redirect URIs in each client
2. Match the redirect URI to your environment
3. Use that client's credentials

---

## Quick Fix Script

If you need to quickly disconnect all Google Calendar connections:

```sql
-- Mark all Google connections as expired
UPDATE calendar_connections
SET status = 'expired',
    error_message = 'OAuth client not found - please reconnect'
WHERE provider = 'google';
```

Then users can reconnect with the correct OAuth client.

---

## Prevention

1. **Don't delete OAuth clients** once they're in use
2. **Document OAuth client IDs** so you know which is which
3. **Use separate clients** for development and production
4. **Test OAuth flow** after changing credentials
5. **Keep environment variables in sync** between GitHub Secrets and Vercel

---

## Next Steps

1. ✅ Verify OAuth client exists in Google Cloud Console
2. ✅ Update environment variables (local and Vercel)
3. ✅ Redeploy application
4. ✅ Disconnect and reconnect calendar
5. ✅ Test calendar connection

---

_Last updated: November 30, 2025_

