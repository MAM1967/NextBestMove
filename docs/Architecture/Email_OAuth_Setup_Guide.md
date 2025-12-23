# Email OAuth Setup Guide

## Gmail & Outlook Integration for Signals v1

This guide provides step-by-step instructions for setting up OAuth 2.0 credentials for Gmail and Outlook email integration. These credentials are separate from calendar OAuth credentials.

---

## Overview

**Purpose:** Enable read-only access to email metadata for Signals v1 feature (NEX-11)

**Required Scopes:**

- **Gmail:** `https://www.googleapis.com/auth/gmail.readonly`
- **Outlook:** `Mail.Read`

**Note:** These are separate OAuth applications from calendar integration. You'll need to create new OAuth credentials specifically for email access.

---

## 1. Gmail OAuth Setup (Google Cloud Console)

### Step 1: Create or Select Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Either:
   - **Select existing project:** Choose your existing NextBestMove project (if you have one)
   - **Create new project:** Click "New Project"
     - Project name: `NextBestMove Email`
     - Organization: (select if applicable)
     - Click "Create"

### Step 2: Enable Gmail API

1. In the Google Cloud Console, navigate to **APIs & Services** → **Library**
2. Search for "Gmail API"
3. Click on "Gmail API" from the results
4. Click **"Enable"** button
5. Wait for the API to be enabled (usually takes a few seconds)

### Step 3: Configure OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Select **"External"** user type (unless you have Google Workspace)
3. Click **"Create"**

**App Information:**

- **App name:** `NextBestMove`
- **User support email:** (your email)
- **App logo:** (optional, upload if you have one)
- **App domain:** (your production domain, e.g., `nextbestmove.com`)
- **Developer contact information:** (your email)
- Click **"Save and Continue"**

**Scopes:**

- Click **"Add or Remove Scopes"**
- Search for and select:
  - `https://www.googleapis.com/auth/gmail.readonly`
- Click **"Update"**
- Click **"Save and Continue"**

**Test Users (for development):**

- Add your test email addresses
- Click **"Save and Continue"**

**Summary:**

- Review the information
- Click **"Back to Dashboard"**

### Step 4: Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. **Application type:** Select **"Web application"**
4. **Name:** `NextBestMove Email OAuth Client`

**Authorized JavaScript origins:**
Add your application URLs:

```
http://localhost:3000
https://your-staging-domain.com
https://your-production-domain.com
```

**Authorized redirect URIs:**
Add your callback URLs:

```
http://localhost:3000/api/email/connect/gmail/callback
https://your-staging-domain.com/api/email/connect/gmail/callback
https://your-production-domain.com/api/email/connect/gmail/callback
```

5. Click **"Create"**
6. **IMPORTANT:** Copy the **Client ID** and **Client Secret** immediately
   - You won't be able to see the secret again
   - Store them securely (we'll add to environment variables)

### Step 5: Download Credentials (Optional)

1. Click the download icon (⬇️) next to your OAuth client
2. Save the JSON file securely (contains Client ID and Secret)
3. **DO NOT commit this file to git**

---

## 2. Outlook OAuth Setup (Azure AD)

### Step 1: Register Application in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **"+ New registration"**

**Application Details:**

- **Name:** `NextBestMove Email`
- **Supported account types:**
  - Select **"Accounts in any organizational directory and personal Microsoft accounts"** (most common)
  - OR **"Single tenant"** if you only want organizational accounts
- **Redirect URI:**
  - Platform: **"Web"**
  - URI: `http://localhost:3000/api/email/connect/outlook/callback`
  - Click **"Add"** to add additional URIs:
    - `https://your-staging-domain.com/api/email/connect/outlook/callback`
    - `https://your-production-domain.com/api/email/connect/outlook/callback`
- Click **"Register"**

### Step 2: Configure API Permissions

1. In your app registration, navigate to **"API permissions"**
2. Click **"+ Add a permission"**
3. Select **"Microsoft Graph"**
4. Select **"Delegated permissions"**
5. Search for and select:
   - `Mail.Read` (Read user mail)
6. Click **"Add permissions"**

**Important:** For production, you may need to:

- Click **"Grant admin consent"** if you're an admin (for organizational accounts)
- For personal Microsoft accounts, users will consent during OAuth flow

### Step 3: Create Client Secret

1. Navigate to **"Certificates & secrets"**
2. Click **"+ New client secret"**
3. **Description:** `NextBestMove Email OAuth Secret`
4. **Expires:** Select expiration (recommend 24 months for production)
5. Click **"Add"**
6. **IMPORTANT:** Copy the **Value** immediately (you won't be able to see it again)
   - Store it securely (we'll add to environment variables)

### Step 4: Copy Application (Client) ID

1. In your app registration, navigate to **"Overview"**
2. Copy the **Application (client) ID**
   - This is your Client ID for OAuth
   - Store it securely (we'll add to environment variables)

### Step 5: Note Tenant ID

1. In the **"Overview"** section, note the **Directory (tenant) ID**
   - For most cases, use `common` (supports both personal and organizational accounts)
   - For single-tenant, use the specific tenant ID
   - Store it securely (we'll add to environment variables)

---

## 3. Environment Variables

Add the following environment variables to your `.env.local` (development) and production environment:

### Gmail OAuth Credentials

**Production Client (NextBestMove-Email):**

- Use for production environment
- Redirect URI: `https://nextbestmove.app/api/email/connect/gmail/callback`

**Test Client (NextBestMove-Email-Test):**

- Use for local development and staging
- Redirect URIs:
  - Local: `http://localhost:3000/api/email/connect/gmail/callback`
  - Staging: `https://staging.nextbestmove.app/api/email/connect/gmail/callback`

**Environment Variables:**

```env
# Gmail OAuth (for email metadata ingestion)
# Production: Use NextBestMove-Email client
# Development/Staging: Use NextBestMove-Email-Test client
GMAIL_CLIENT_ID=your-gmail-client-id-here
GMAIL_CLIENT_SECRET=your-gmail-client-secret-here
GMAIL_REDIRECT_URI=https://nextbestmove.app/api/email/connect/gmail/callback
```

**Note:**

- Store actual credentials in Doppler (production) and `.env.local` (development)
- Use test client for local development and staging
- Use production client for production environment

### Outlook OAuth Credentials

**Environment Variables:**

```env
# Outlook OAuth (for email metadata ingestion)
# Note: Uses OUTLOOK_EMAIL_ prefix to differentiate from calendar OAuth (OUTLOOK_CLIENT_ID/SECRET)
OUTLOOK_EMAIL_CLIENT_ID=your-outlook-client-id-here
OUTLOOK_EMAIL_CLIENT_SECRET=your-outlook-client-secret-here
OUTLOOK_EMAIL_TENANT_ID=your-tenant-id-here
OUTLOOK_EMAIL_REDIRECT_URI=https://nextbestmove.app/api/email/connect/outlook/callback
```

**For local development:**

```env
OUTLOOK_EMAIL_REDIRECT_URI=http://localhost:3000/api/email/connect/outlook/callback
```

**For staging:**

```env
OUTLOOK_EMAIL_REDIRECT_URI=https://staging.nextbestmove.app/api/email/connect/outlook/callback
```

**Important Notes:**

- **Variable naming:** Use `OUTLOOK_EMAIL_*` prefix to differentiate from calendar OAuth (`OUTLOOK_CLIENT_*`)
  - Calendar OAuth: `OUTLOOK_CLIENT_ID`, `OUTLOOK_CLIENT_SECRET`
  - Email OAuth: `OUTLOOK_EMAIL_CLIENT_ID`, `OUTLOOK_EMAIL_CLIENT_SECRET`, `OUTLOOK_EMAIL_TENANT_ID`, `OUTLOOK_EMAIL_REDIRECT_URI`
- **Redirect URI:** Must be set in both Azure Portal and environment variables (Doppler for production)
- **Tenant ID:** Use your specific Azure AD tenant ID (not `common` unless using multi-tenant)
- **Store actual credentials securely:** Use Doppler for production, `.env.local` for development (never commit to git)

---

## 4. OAuth Scopes Reference

### Gmail Scopes

**Required:**

- `https://www.googleapis.com/auth/gmail.readonly` - Read-only access to email metadata

**What this allows:**

- Read email metadata (subject, sender, recipient, date, labels)
- Read email snippets (first 200 characters)
- Read email thread information
- **Does NOT allow:** Reading full email body, sending emails, deleting emails

### Outlook Scopes

**Required:**

- `Mail.Read` - Read user mail

**What this allows:**

- Read email metadata (subject, sender, recipient, date, categories)
- Read email body preview
- Read email attachments metadata
- **Does NOT allow:** Sending emails, deleting emails, modifying emails

---

## 5. Redirect URI Patterns

### Development

```
http://localhost:3000/api/email/connect/{provider}/callback
```

### Staging

```
https://staging.nextbestmove.com/api/email/connect/{provider}/callback
```

### Production

```
https://nextbestmove.com/api/email/connect/{provider}/callback
```

**Where `{provider}` is:**

- `gmail` for Gmail
- `outlook` for Outlook

---

## 6. Testing OAuth Flow

### Test Gmail Connection

1. Navigate to your app's email connection page
2. Click "Connect Gmail"
3. You should be redirected to Google OAuth consent screen
4. Sign in with a test Google account
5. Review permissions (should show "Read your email metadata")
6. Click "Allow"
7. You should be redirected back to your app with authorization code
8. App should exchange code for tokens and store them

### Test Outlook Connection

1. Navigate to your app's email connection page
2. Click "Connect Outlook"
3. You should be redirected to Microsoft OAuth consent screen
4. Sign in with a test Microsoft account
5. Review permissions (should show "Read your mail")
6. Click "Accept"
7. You should be redirected back to your app with authorization code
8. App should exchange code for tokens and store them

---

## 7. Security Best Practices

### 1. Store Secrets Securely

- **Never commit** OAuth credentials to git
- Use environment variables or secret management service (e.g., Vercel Environment Variables, AWS Secrets Manager)
- Rotate secrets periodically (every 6-12 months)

### 2. Encrypt Refresh Tokens

- Encrypt refresh tokens before storing in database
- Use application-level encryption (not database-level)
- Store encryption key securely (environment variable)

### 3. Limit Redirect URIs

- Only add redirect URIs for domains you control
- Use HTTPS in production (never HTTP)
- Remove unused redirect URIs

### 4. Monitor OAuth Usage

- Set up alerts for unusual OAuth activity
- Monitor token refresh failures
- Track API quota usage (Gmail: 1 billion quota units/day, Outlook: varies by plan)

### 5. Handle Token Expiration

- Implement automatic token refresh
- Handle refresh failures gracefully
- Notify users when connection expires

---

## 8. Troubleshooting

### Gmail OAuth Issues

**Error: "redirect_uri_mismatch"**

- Check that redirect URI in code matches exactly with Google Cloud Console
- Ensure protocol (http/https) matches
- Ensure port number matches (if using localhost)

**Error: "access_denied"**

- User may have denied permissions
- Check OAuth consent screen configuration
- Ensure test users are added (for development)

**Error: "invalid_client"**

- Check that Client ID and Secret are correct
- Ensure environment variables are loaded correctly
- Check for typos in credentials

### Outlook OAuth Issues

**Error: "AADSTS50011: The reply URL specified in the request does not match"**

- Check that redirect URI in code matches exactly with Azure Portal
- Ensure all redirect URIs are added to Azure Portal
- Check for trailing slashes or case sensitivity

**Error: "AADSTS70011: Invalid scope"**

- Check that `Mail.Read` permission is added in Azure Portal
- Ensure permission is granted (admin consent may be required)

**Error: "AADSTS65005: The application requires access to a service"**

- Admin consent may be required for organizational accounts
- Grant admin consent in Azure Portal → API permissions

---

## 9. Production Checklist

Before deploying to production:

- [ ] OAuth credentials created for production domain
- [ ] Redirect URIs configured for production domain (HTTPS only)
- [ ] Environment variables set in production environment
- [ ] OAuth consent screen published (Gmail) or admin consent granted (Outlook)
- [ ] Test OAuth flow in production environment
- [ ] Monitor OAuth errors and token refresh
- [ ] Set up alerts for OAuth failures
- [ ] Document credentials location (password manager, secret manager)
- [ ] Rotate credentials schedule established

---

## 10. Additional Resources

### Gmail API Documentation

- [Gmail API Overview](https://developers.google.com/gmail/api)
- [Gmail API Reference](https://developers.google.com/gmail/api/reference/rest)
- [OAuth 2.0 for Gmail](https://developers.google.com/identity/protocols/oauth2)

### Microsoft Graph API Documentation

- [Microsoft Graph API Overview](https://docs.microsoft.com/en-us/graph/overview)
- [Mail API Reference](https://docs.microsoft.com/en-us/graph/api/resources/mail-api-overview)
- [OAuth 2.0 for Microsoft](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)

### NextBestMove Implementation

- See `/web/src/app/api/email/connect/` for OAuth implementation
- See `/web/src/lib/email/` for email API integration
- Reference: Calendar OAuth implementation in `/web/src/app/api/calendar/`

---

## Notes

- **Separate from Calendar OAuth:** These credentials are different from calendar OAuth credentials. You'll have separate OAuth clients for calendar and email.
- **Read-Only Access:** Both Gmail and Outlook integrations request read-only permissions. Users cannot send or delete emails through NextBestMove.
- **Privacy-First:** We only access email metadata (subject, sender, date, labels) and snippets (first 200 chars), not full email content.
- **Token Storage:** Refresh tokens are encrypted before storing in `email_connections` table, similar to calendar token storage.
