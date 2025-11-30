# Google Calendar Token Refresh Error: "invalid_client"

**Error:** `Token refresh failed: { "error": "invalid_client", "error_description": "The OAuth client was not found." }`

---

## Problem

The refresh token stored in your database was issued by a different Google OAuth client than the one currently configured in your environment variables. Refresh tokens are tied to specific OAuth clients and cannot be used with different client credentials.

---

## Root Causes

1. **OAuth Client Changed:** The `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` in your environment variables doesn't match the client that issued the refresh token
2. **OAuth Client Deleted:** The OAuth client was deleted in Google Cloud Console
3. **Environment Variables Missing/Incorrect:** `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` are not set or set incorrectly
4. **Different Environments:** Using a refresh token from production with development credentials (or vice versa)

---

## Solution

### Option 1: Reconnect Calendar (Recommended)

The simplest solution is to disconnect and reconnect the calendar:

1. **Disconnect the calendar:**
   - Go to Settings → Calendar
   - Click "Disconnect" for Google Calendar
   - This will remove the old refresh token

2. **Reconnect the calendar:**
   - Click "Connect Google Calendar"
   - Complete the OAuth flow
   - This will create a new refresh token using the current OAuth client

**Why this works:** The new refresh token will be issued by the current OAuth client, so it will work with your current environment variables.

---

### Option 2: Fix Environment Variables

If you know the original OAuth client credentials:

1. **Check Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to APIs & Services → Credentials
   - Find your OAuth 2.0 Client ID
   - Copy the Client ID and Client Secret

2. **Update Environment Variables:**
   ```bash
   # In .env.local (local development)
   GOOGLE_CLIENT_ID=your-actual-client-id
   GOOGLE_CLIENT_SECRET=your-actual-client-secret
   ```

3. **Update Vercel Environment Variables:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
   - Redeploy the application

4. **Restart your local server** (if testing locally)

**Note:** This only works if the OAuth client still exists and matches the refresh token. If the client was deleted, you must reconnect (Option 1).

---

### Option 3: Create New OAuth Client (If Original Was Deleted)

If the original OAuth client was deleted:

1. **Create new OAuth client in Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/calendar/callback/google` (for local)
     - `https://nextbestmove.app/api/calendar/callback/google` (for production)
   - Save and copy the Client ID and Client Secret

2. **Update environment variables** (see Option 2)

3. **Reconnect calendar** (see Option 1) - Required because old refresh token won't work with new client

---

## Verification Steps

### 1. Check Environment Variables

```bash
# Local development
cat .env.local | grep GOOGLE

# Should show:
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
```

### 2. Check Vercel Environment Variables

1. Go to Vercel Dashboard
2. Project → Settings → Environment Variables
3. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
4. Check they match your Google Cloud Console credentials

### 3. Test Token Refresh

After fixing environment variables, the next calendar sync should work. Check:
- Settings → Calendar → Status should show "active"
- Last sync time should update
- No error messages

---

## Prevention

### Best Practices

1. **Don't delete OAuth clients** once they're in use
2. **Use separate OAuth clients** for development and production
3. **Document OAuth client IDs** so you know which one is which
4. **Version control environment variables** (use `.env.example` with placeholders, not actual secrets)

### Environment-Specific Clients

**Recommended Setup:**
- **Development:** One OAuth client for `localhost:3000`
- **Production:** One OAuth client for `nextbestmove.app`
- **Staging:** (Optional) One OAuth client for staging domain

This prevents issues when switching between environments.

---

## Quick Fix Script

If you need to quickly disconnect all expired Google Calendar connections:

```sql
-- Mark all Google Calendar connections as expired
UPDATE calendar_connections
SET status = 'expired',
    error_message = 'OAuth client mismatch - please reconnect'
WHERE provider = 'google'
  AND status = 'active';
```

Then users will need to reconnect their calendars.

---

## Related Files

- Token refresh logic: `web/src/lib/calendar/tokens.ts`
- Provider configuration: `web/src/lib/calendar/providers.ts`
- Calendar status: `web/src/lib/calendar/status.ts`
- Connect endpoint: `web/src/app/api/calendar/connect/[provider]/route.ts`

---

## Still Having Issues?

If reconnecting doesn't work:

1. **Check Google Cloud Console:**
   - Verify OAuth client exists
   - Check redirect URIs are correct
   - Ensure Calendar API is enabled

2. **Check logs:**
   - Server logs for detailed error messages
   - Browser console for client-side errors

3. **Verify encryption:**
   - Ensure `CALENDAR_ENCRYPTION_KEY` is set correctly
   - Token decryption might be failing

4. **Test OAuth flow:**
   - Try connecting a new calendar
   - If connection fails, the issue is with OAuth setup, not token refresh

---

_Last updated: November 30, 2025_

