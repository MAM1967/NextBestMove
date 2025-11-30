# Google Calendar Token Error - Quick Fix

**Error:** `invalid_client - The OAuth client was not found`

---

## Quick Fix (2 minutes)

### Step 1: Disconnect Calendar
1. Go to **Settings → Calendar**
2. Click **"Disconnect"** button
3. Confirm disconnection

### Step 2: Reconnect Calendar
1. Click **"Connect Google"** button
2. Complete Google OAuth flow
3. Calendar should now work

**That's it!** The new connection will use the current OAuth client credentials.

---

## Why This Happens

The refresh token stored in the database was issued by a different Google OAuth client than what's currently configured. Refresh tokens are tied to specific OAuth clients and can't be used with different credentials.

**Common causes:**
- OAuth client ID/secret changed in environment variables
- OAuth client was deleted in Google Cloud Console
- Using different credentials for development vs production

---

## If Reconnecting Doesn't Work

### Check Environment Variables

**Local (.env.local):**
```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

**Vercel (Production):**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
3. Check they match your Google Cloud Console credentials

### Verify Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services → Credentials**
3. Find your OAuth 2.0 Client ID
4. Verify it exists and is enabled
5. Check redirect URIs include:
   - `https://nextbestmove.app/api/calendar/callback/google` (production)
   - `http://localhost:3000/api/calendar/callback/google` (local)

---

## Need More Help?

See full troubleshooting guide: `docs/Troubleshooting/Google_Calendar_Token_Refresh_Error.md`

