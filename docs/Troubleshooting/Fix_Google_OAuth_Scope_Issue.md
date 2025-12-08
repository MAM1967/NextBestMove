# Fix Google OAuth Scope Issue - Trust and Safety

## Problem
Google Trust and Safety contacted you because the OAuth consent screen is requesting `calendar.calendars.readonly` scope, which is not needed.

## Required Action

### ✅ Use This Scope (Already in Code):
```
https://www.googleapis.com/auth/calendar.readonly
```

### ❌ Remove This Scope (Must Remove from Google Cloud Console):
```
https://www.googleapis.com/auth/calendar.calendars.readonly
```

---

## Step 1: Verify Code is Correct

Our code in `web/src/lib/calendar/providers.ts` already uses the correct scope:
```typescript
scope: "openid email https://www.googleapis.com/auth/calendar.readonly"
```

✅ **Code is correct** - we're using `calendar.readonly`, not `calendar.calendars.readonly`.

---

## Step 2: Fix Google Cloud Console OAuth Consent Screen

The issue is in the **Google Cloud Console OAuth consent screen configuration**, not in our code.

### Steps to Fix:

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/
   - Select your project
   - Go to **APIs & Services** → **OAuth consent screen**

2. **Check "Scopes" Section:**
   - Look for any scope that includes `calendar.calendars.readonly`
   - **Remove it** if present

3. **Verify Only These Scopes Are Listed:**
   - `openid`
   - `email`
   - `https://www.googleapis.com/auth/calendar.readonly`

4. **Save Changes**

---

## Step 3: Verify OAuth Client Configuration

1. **Go to APIs & Services** → **Credentials**
2. **Find your OAuth 2.0 Client IDs:**
   - "NextBestMove" (production)
   - "NextBestMove-Test" (staging)
3. **Check that scopes are not hardcoded in the client configuration**
   - OAuth clients should inherit scopes from the consent screen
   - If there are any scope restrictions on the client, remove `calendar.calendars.readonly`

---

## Step 4: Resubmit for Verification

After removing `calendar.calendars.readonly` from the OAuth consent screen:

1. **Go to OAuth consent screen**
2. **Click "PUBLISH APP" or "SUBMIT FOR VERIFICATION"**
3. **Fill out the verification form:**
   - Explain that you only use `calendar.readonly` for reading calendar events
   - Explain that you do NOT use `calendar.calendars.readonly`
   - Provide use case: Reading user's calendar events to determine available time for daily action planning

---

## Understanding the Difference

### `calendar.readonly` (✅ What We Use):
- **Purpose:** Read-only access to calendar events
- **What it allows:** View events on calendars the user can access
- **What we need it for:** Free/busy data and event listing for daily plan generation

### `calendar.calendars.readonly` (❌ What We DON'T Need):
- **Purpose:** Read-only access to calendar metadata (calendar list, settings, etc.)
- **What it allows:** View calendar titles, descriptions, time zones, sharing settings
- **Why we don't need it:** We only need event data, not calendar metadata

---

## Verification Checklist

- [ ] Code uses `calendar.readonly` (already correct)
- [ ] Google Cloud Console OAuth consent screen does NOT have `calendar.calendars.readonly`
- [ ] OAuth consent screen only has: `openid`, `email`, `calendar.readonly`
- [ ] OAuth client configurations don't restrict to wrong scopes
- [ ] App resubmitted for verification in Google Cloud Console
- [ ] Tested OAuth flow still works after changes

---

## Testing After Fix

1. **Disconnect calendar** in app settings (if connected)
2. **Reconnect calendar** - should only request `calendar.readonly`
3. **Verify consent screen** shows correct scopes
4. **Test functionality:**
   - Free/busy data still works
   - Event listing still works
   - Daily plan generation still works

---

## Notes

- The scope issue is in **Google Cloud Console**, not in our code
- Our code already uses the correct scope (`calendar.readonly`)
- You need to manually remove `calendar.calendars.readonly` from the OAuth consent screen in Google Cloud Console
- After fixing, resubmit the app for verification

