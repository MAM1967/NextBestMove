# Google OAuth Client Diagnostic Steps

**Error Client ID:** `732850218816-6b8ft52uum9dh2m18uk86jo4o8dk96cm.apps.googleusercontent.com`

---

## Immediate Actions

### 1. Check Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Look for OAuth 2.0 Client IDs
5. **Search for:** `732850218816-6b8ft52uum9dh2m18uk86jo4o8dk96cm`

**If found:**
- ✅ Check if it's **enabled** (not disabled)
- ✅ Verify redirect URIs include your callback URL
- ✅ Copy the Client ID and Client Secret

**If NOT found:**
- The client was deleted or never existed
- You need to create a new one (see below)

---

### 2. Check Environment Variables

**Local (.env.local):**
```bash
# Check what's currently set
cat .env.local | grep GOOGLE_CLIENT_ID
cat .env.local | grep GOOGLE_CLIENT_SECRET
```

**Vercel:**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Check `GOOGLE_CLIENT_ID` value
3. Does it match `732850218816-6b8ft52uum9dh2m18uk86jo4o8dk96cm`?

**If they don't match:**
- The environment variable has the wrong client ID
- Update it to match an existing OAuth client

---

### 3. Testing vs Production Mode

When you switch between **Testing** and **Production** in Google Cloud Console:

- **The OAuth client ID/secret don't change**
- **Only the app publishing status changes**
- **Test users list applies in testing mode**

**If you're getting "client not found":**
- The OAuth client was likely **deleted** or **disabled**
- Or the environment variables point to a **non-existent client**

---

## Solution: Create New OAuth Client

### Step 1: Create OAuth Client in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**

4. **If prompted to configure OAuth consent screen:**
   - **User Type:** External
   - **App name:** NextBestMove
   - **User support email:** Your email
   - **Developer contact:** Your email
   - **Scopes:** Click "Add or Remove Scopes"
     - Search for: `calendar.readonly`
     - Select: `https://www.googleapis.com/auth/calendar.readonly`
     - Click "Update"
   - **Test users:** (If in testing mode) Add your email
   - Click "Save and Continue" through all steps
   - Click "Back to Dashboard"

5. **Create OAuth Client:**
   - **Application type:** Web application
   - **Name:** NextBestMove Calendar (Production)
   - **Authorized JavaScript origins:**
     - `https://nextbestmove.app`
     - `http://localhost:3000` (for local dev)
   - **Authorized redirect URIs:**
     - `https://nextbestmove.app/api/calendar/callback/google`
     - `http://localhost:3000/api/calendar/callback/google`
   - Click **"CREATE"**

6. **Copy credentials:**
   - **Client ID:** `xxxxx.apps.googleusercontent.com`
   - **Client Secret:** `GOCSPX-xxxxx`
   - ⚠️ **Save these immediately** - you can't see the secret again!

---

### Step 2: Update Environment Variables

#### Local Development

Edit `web/.env.local`:
```bash
GOOGLE_CLIENT_ID=your-new-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-new-client-secret
```

**Important:** 
- No quotes around values
- No trailing spaces or newlines
- Restart your dev server after updating

#### Vercel Production

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Find `GOOGLE_CLIENT_ID` → Click "Edit" → Paste new Client ID → Save
3. Find `GOOGLE_CLIENT_SECRET` → Click "Edit" → Paste new Client Secret → Save
4. **Redeploy** the application

#### GitHub Secrets (For Auto-Sync)

1. Go to GitHub → Repository → Settings → Secrets and variables → Actions
2. Update `GOOGLE_CLIENT_ID` with new value
3. Update `GOOGLE_CLIENT_SECRET` with new value
4. The next push will sync these to Vercel

---

### Step 3: Reconnect Calendar

1. **Disconnect:**
   - Settings → Calendar → Click "Disconnect"

2. **Reconnect:**
   - Click "Connect Google"
   - Complete OAuth flow
   - Should work now!

---

## Verify OAuth Client Configuration

### Required Settings

✅ **Application type:** Web application  
✅ **Authorized redirect URIs:**
   - `https://nextbestmove.app/api/calendar/callback/google` (production)
   - `http://localhost:3000/api/calendar/callback/google` (local)

✅ **OAuth consent screen:**
   - Status: Testing or Published
   - Scopes: `https://www.googleapis.com/auth/calendar.readonly`

✅ **Environment variables:**
   - `GOOGLE_CLIENT_ID` matches the client ID in Google Cloud Console
   - `GOOGLE_CLIENT_SECRET` matches the client secret in Google Cloud Console

---

## Testing Mode vs Production Mode

### Testing Mode
- ✅ No video required
- ✅ Only test users can authenticate
- ✅ OAuth client works normally
- ✅ Good for development

### Production Mode
- ⚠️ Requires verification (including video)
- ✅ Available to all users
- ✅ OAuth client ID/secret don't change

**Important:** Switching between testing/production doesn't change the OAuth client ID. If you're getting "client not found", the client was deleted or the credentials are wrong.

---

## Quick Verification

After updating environment variables, verify:

```bash
# Check environment variable is set (local)
echo $GOOGLE_CLIENT_ID

# Or check in code
# The client ID should appear in the OAuth URL when connecting
```

When you click "Connect Google", the OAuth URL should contain your client ID. If it doesn't match what's in Google Cloud Console, the environment variable is wrong.

---

## Still Not Working?

1. **Double-check OAuth client exists:**
   - Google Cloud Console → Credentials
   - Verify client ID matches exactly

2. **Check redirect URIs:**
   - Must match exactly: `https://nextbestmove.app/api/calendar/callback/google`
   - No trailing slashes
   - Must be HTTPS for production

3. **Verify environment variables:**
   - Check for typos
   - Check for extra spaces/newlines
   - Restart dev server / redeploy Vercel

4. **Check OAuth consent screen:**
   - Must have `calendar.readonly` scope
   - Must be in Testing or Published status

---

_Last updated: November 30, 2025_

