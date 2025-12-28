# Add PRODUCTION_GOOGLE_CLIENT_SECRET Environment Variable

## Problem
Production OAuth is failing with `invalid_client` error because Vercel is providing the staging client secret (`GOCSPX-3zD...`) instead of the production client secret.

## Solution
Add a new environment variable `PRODUCTION_GOOGLE_CLIENT_SECRET` to Vercel (Production scope) with the production client secret.

---

## Step 1: Get Production Client Secret

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/
   - Select your project
   - Go to **APIs & Services** → **Credentials**
   - Find **"NextBestMove"** client (production, NOT "NextBestMove-Test")
   - Client ID should start with: `732850218816-5een...`

2. **Get the Client Secret:**
   - Click on the "NextBestMove" client
   - Find the "Client secrets" section
   - Copy the client secret (starts with `GOCSPX-...`)
   - **Note:** This is different from the staging secret which starts with `GOCSPX-3zD...`

---

## Step 2: Add to Vercel

1. **Go to Vercel Dashboard:**
   - Your Project → **Settings** → **Environment Variables**

2. **Add New Variable:**
   - Click **"Add New"**
   - **Key:** `PRODUCTION_GOOGLE_CLIENT_SECRET`
   - **Value:** Paste the production client secret from Google Cloud Console
   - **Environment:** Select **Production** only (NOT Preview, NOT Development)
   - Click **Save**

3. **Verify:**
   - Filter by **Production** scope
   - You should see:
     - `GOOGLE_CLIENT_ID` = `732850218816-5een...` (production)
     - `GOOGLE_CLIENT_SECRET` = `GOCSPX-3zD...` (staging - this is the bug)
     - `PRODUCTION_GOOGLE_CLIENT_SECRET` = `GOCSPX-UDm3Gmo4XLoGH...` (production - new)

---

## Step 3: Redeploy Production

After adding the environment variable:

1. **Trigger a new production deployment:**
   - Push to `main` branch, OR
   - Go to Vercel Dashboard → Deployments → Click "..." → "Redeploy"

2. **Wait for deployment to complete** (2-3 minutes)

3. **Test OAuth:**
   - Try connecting Google Calendar again
   - Should work now!

---

## How It Works

The code now:
1. Detects when Vercel provides staging client secret (`GOCSPX-3zD...`) in production
2. Uses `PRODUCTION_GOOGLE_CLIENT_SECRET` env var if available
3. Falls back to `GOOGLE_CLIENT_SECRET` if production-specific var not set
4. Logs warnings if production secret is not configured

---

## Verification

After deployment, check Vercel logs for:
```
🔧 WORKAROUND: Overriding GOOGLE_CLIENT_SECRET for Production build
   Vercel provided (staging): GOCSPX-3zD...
   Using PRODUCTION_GOOGLE_CLIENT_SECRET env var instead
```

If you see an error like:
```
[OAuth Config] Production build detected staging client secret, but PRODUCTION_GOOGLE_CLIENT_SECRET env var not set!
```

Then the environment variable wasn't added correctly. Double-check:
- Variable name is exactly: `PRODUCTION_GOOGLE_CLIENT_SECRET`
- Scope is set to **Production** only
- Value matches the production client secret from Google Cloud Console

---

## Quick Checklist

- [ ] Got production client secret from Google Cloud Console ("NextBestMove" client)
- [ ] Added `PRODUCTION_GOOGLE_CLIENT_SECRET` to Vercel (Production scope)
- [ ] Verified variable is in Production scope only
- [ ] Redeployed production
- [ ] Tested OAuth connection - works!










