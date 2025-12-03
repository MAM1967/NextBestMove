# Outlook/Microsoft Azure AD Redirect URIs

**For:** Azure AD App Registration (Microsoft Entra ID)  
**Purpose:** OAuth 2.0 redirect URIs for Outlook Calendar integration

---

## Required Redirect URIs

You need to add these redirect URIs to your Azure AD app registration in the Azure Portal.

### Production Environment

```
https://nextbestmove.app/api/calendar/callback/outlook
```

### Staging Environment (if applicable)

```
https://staging.nextbestmove.app/api/calendar/callback/outlook
```

### Local Development

```
http://localhost:3000/api/calendar/callback/outlook
```

---

## How to Add Redirect URIs in Azure Portal

### Step 1: Navigate to Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Microsoft Entra ID** (formerly Azure Active Directory)
3. Go to **App registrations**
4. Select your app registration (or create a new one)

### Step 2: Add Redirect URIs

1. In your app registration, go to **Authentication** (left sidebar)
2. Under **Platform configurations**, click **Add a platform**
3. Select **Web**
4. Add each redirect URI:

   **For Production:**
   ```
   https://nextbestmove.app/api/calendar/callback/outlook
   ```

   **For Staging (if using):**
   ```
   https://staging.nextbestmove.app/api/calendar/callback/outlook
   ```

   **For Local Development:**
   ```
   http://localhost:3000/api/calendar/callback/outlook
   ```

5. Click **Configure**

### Step 3: Verify Settings

Make sure:
- ✅ **Access tokens** is checked (if you need ID tokens)
- ✅ **ID tokens** is checked (if you need ID tokens)
- ✅ All redirect URIs are listed correctly
- ✅ No typos in the URIs

---

## Important Notes

### URI Format

The redirect URI format is:
```
{ORIGIN}/api/calendar/callback/{PROVIDER}
```

Where:
- `{ORIGIN}` = Your domain (e.g., `https://nextbestmove.app`)
- `{PROVIDER}` = `outlook` (lowercase)

### Case Sensitivity

- The provider name must be lowercase: `outlook` (not `Outlook` or `OUTLOOK`)
- The path is case-sensitive: `/api/calendar/callback/outlook`

### Required Scopes

Make sure your Azure AD app registration has these API permissions:

- ✅ `Calendars.Read` (Delegated) - Read user's calendars
- ✅ `offline_access` (Delegated) - Maintain access to data users have granted
- ✅ `openid` (Delegated) - Sign users in
- ✅ `email` (Delegated) - View users' email address
- ✅ `profile` (Delegated) - View users' basic profile

### Supported Account Types

In Azure AD app registration → **Authentication** → **Supported account types**, select:

- ✅ **Accounts in any organizational directory and personal Microsoft accounts** (most common)
- OR
- ✅ **Accounts in any organizational directory** (if you only want work/school accounts)
- OR
- ✅ **Personal Microsoft accounts only** (if you only want personal accounts)

---

## Testing Redirect URIs

### Test Locally

1. Start your development server: `npm run dev`
2. Navigate to: `http://localhost:3000/app/settings`
3. Click "Connect Outlook Calendar"
4. You should be redirected to Microsoft login
5. After authentication, you should be redirected back to: `http://localhost:3000/api/calendar/callback/outlook`

### Common Errors

**Error: "redirect_uri_mismatch"**
- **Cause:** Redirect URI in Azure AD doesn't match the one in your request
- **Fix:** Verify the redirect URI in Azure Portal exactly matches: `https://nextbestmove.app/api/calendar/callback/outlook`

**Error: "invalid_client"**
- **Cause:** Client ID or Client Secret is incorrect
- **Fix:** Verify environment variables `MICROSOFT_CLIENT_ID` and `MICROSOFT_CLIENT_SECRET`

**Error: "invalid_scope"**
- **Cause:** Required scopes not granted in Azure AD
- **Fix:** Add API permissions: `Calendars.Read`, `offline_access`, `openid`, `email`, `profile`

---

## Environment Variables

Make sure these are set in your environment:

```env
# Microsoft OAuth (Outlook)
MICROSOFT_CLIENT_ID=your-azure-ad-client-id
MICROSOFT_CLIENT_SECRET=your-azure-ad-client-secret
MICROSOFT_TENANT_ID=common  # or your specific tenant ID
```

---

## Quick Checklist

- [ ] Created Azure AD app registration
- [ ] Added redirect URI: `https://nextbestmove.app/api/calendar/callback/outlook`
- [ ] Added redirect URI: `http://localhost:3000/api/calendar/callback/outlook` (for local dev)
- [ ] Added API permissions: `Calendars.Read`, `offline_access`, `openid`, `email`, `profile`
- [ ] Set supported account types
- [ ] Copied Client ID and Client Secret to environment variables
- [ ] Tested OAuth flow locally
- [ ] Tested OAuth flow in production

---

## Reference

- **Azure Portal:** https://portal.azure.com
- **Microsoft Identity Platform Docs:** https://learn.microsoft.com/en-us/azure/active-directory/develop/
- **OAuth 2.0 Redirect URI Best Practices:** https://learn.microsoft.com/en-us/azure/active-directory/develop/reply-url

---

**Last Updated:** January 2025

