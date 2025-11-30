# Google OAuth Client Test Results

**Date:** November 30, 2025  
**Client ID:** `732850218816-6b8ft52uum9dh2m18uk86jo4o8dk96cm.apps.googleusercontent.com`

---

## Test Results

### ✅ Client Credentials Test: PASSED

**Test:** Attempted token refresh with invalid refresh token
**Result:** `invalid_grant` (expected)
**Conclusion:** Client credentials are **VALID** - Google recognizes the client ID and secret

### ✅ Authorization URL Test: PASSED

**Test:** Attempted authorization request
**Result:** HTTP 302 redirect (accepted)
**Conclusion:** Authorization endpoint accepts the client ID

---

## Root Cause Analysis

Since the client credentials are valid, the `invalid_client` error you're seeing is likely caused by:

### 1. **OAuth Consent Screen Configuration** (Most Likely)

When you switched from **Production** to **Testing** mode:

- **Testing Mode:** Only users in the "Test users" list can authenticate
- If the user trying to connect is **not** in the test users list, Google will reject the request
- The error might appear as `invalid_client` in some cases

**Fix:**
1. Go to Google Cloud Console → **APIs & Services** → **OAuth consent screen**
2. Check if app is in **Testing** mode
3. If in Testing mode:
   - Add your email (and any test users) to **Test users** list
   - OR switch back to **Production** mode (requires verification/video)

### 2. **Refresh Token Mismatch**

The refresh token in your database was issued by a different OAuth client.

**Fix:**
- Disconnect and reconnect the calendar
- This will create a new refresh token with the current client

### 3. **Environment Variable Mismatch**

Vercel might have different credentials than local.

**Fix:**
- Verify Vercel environment variables match Google Cloud Console
- Check both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

---

## Recommended Fix

### Step 1: Check OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **OAuth consent screen**
3. Check **Publishing status:**
   - **Testing:** Only test users can connect
   - **Production:** All users can connect (requires verification)

4. **If in Testing mode:**
   - Scroll to **Test users**
   - Click **"+ ADD USERS"**
   - Add your email address
   - Save

### Step 2: Disconnect and Reconnect

1. Settings → Calendar → **Disconnect**
2. Click **"Connect Google"**
3. Complete OAuth flow
4. Should work now!

---

## Verification

After fixing, test the connection:

1. **Connect calendar:** Should redirect to Google login (not error page)
2. **After authorization:** Should redirect back to app successfully
3. **Check status:** Settings → Calendar should show "Connected"

---

## Test Script

The test script is available at: `scripts/test-google-oauth-client.sh`

Run it anytime to verify client credentials:
```bash
./scripts/test-google-oauth-client.sh
```

---

_Last updated: November 30, 2025_

