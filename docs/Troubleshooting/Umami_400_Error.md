# Umami 400 Error Troubleshooting

## Error: 400 Bad Request from `api-gateway.umami.dev`

This error typically means Umami is rejecting the tracking request due to configuration issues.

## Common Causes

### 1. Missing or Invalid Website ID

**Symptoms:**
- 400 error in Network tab
- No data appearing in Umami dashboard

**Fix:**
1. Log into Umami Cloud: https://cloud.umami.is
2. Go to **Settings** → **Websites**
3. Find your website (or create one if missing)
4. Copy the **Website ID** (UUID format, e.g., `ef97f9ec-8da6-4e4f-9bcf-730a9b0cb27d`)
5. Verify in Vercel:
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Check `NEXT_PUBLIC_UMAMI_WEBSITE_ID` matches exactly
   - Ensure no trailing whitespace or newlines
6. Redeploy

### 2. Domain Mismatch

**Symptoms:**
- 400 error persists even with correct Website ID
- Umami dashboard shows website but no data

**Fix:**
1. Log into Umami Cloud
2. Go to **Settings** → **Websites**
3. Click on your website
4. Check the **Domain** field:
   - Should match your production domain: `nextbestmove.app`
   - Or be set to `*` (wildcard) to allow all domains
5. Update domain if needed and save
6. Wait a few minutes and test again

### 3. Website ID Doesn't Belong to Account

**Symptoms:**
- Website ID looks correct but still getting 400
- Website doesn't appear in your Umami dashboard

**Fix:**
1. Verify you're logged into the correct Umami account
2. Check if website exists in your account:
   - Go to **Settings** → **Websites**
   - If website is missing, create a new one
3. Copy the Website ID from the tracking code shown
4. Update Vercel environment variable
5. Redeploy

## Diagnostic Steps

### Step 1: Verify Environment Variables

Check what's actually being used in production:

1. Open browser console on your production site
2. Run:
   ```javascript
   console.log("Umami URL:", process.env.NEXT_PUBLIC_UMAMI_URL);
   console.log("Website ID:", process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID);
   ```
   
   **Note:** This won't work in production because env vars are compiled at build time. Instead:

3. Check the actual script tag in page source:
   - View page source (Ctrl+U / Cmd+U)
   - Search for `umami` or `script.js`
   - Find: `<script defer src="..." data-website-id="...">`
   - Verify the `data-website-id` matches your Umami dashboard

### Step 2: Check Network Request Details

1. Open DevTools → Network tab
2. Filter by `umami` or `api-gateway`
3. Click on the failed request (400 status)
4. Check **Request Payload**:
   - Should include `website` field with your Website ID
   - Should include `hostname` field with your domain
5. Check **Response**:
   - May contain error message explaining the issue

### Step 3: Verify Umami Website Configuration

1. Log into Umami Cloud
2. Go to **Settings** → **Websites**
3. Click on your website
4. Verify:
   - **Name**: Your website name
   - **Domain**: Should be `nextbestmove.app` or `*`
   - **Website ID**: Matches your environment variable
   - **Status**: Should be "Active" or similar

### Step 4: Test with Direct Script Tag

Temporarily add Umami script directly to verify configuration:

1. In `web/src/app/layout.tsx`, temporarily add:
   ```tsx
   <Script
     defer
     src="https://cloud.umami.is/script.js"
     data-website-id="YOUR-WEBSITE-ID-HERE"
   />
   ```
2. Replace `YOUR-WEBSITE-ID-HERE` with your actual Website ID
3. Deploy and test
4. If this works, the issue is with environment variable loading
5. If this fails, the issue is with Umami configuration

## Quick Fix Checklist

- [ ] Website ID is correct UUID format (e.g., `ef97f9ec-8da6-4e4f-9bcf-730a9b0cb27d`)
- [ ] Website ID matches exactly what's shown in Umami dashboard
- [ ] No trailing whitespace or newlines in Website ID
- [ ] Domain in Umami matches your production domain (`nextbestmove.app`)
- [ ] Environment variables are set in Vercel for Production environment
- [ ] Application has been redeployed after setting environment variables
- [ ] Website exists and is active in Umami dashboard

## Still Not Working?

1. **Create a new website in Umami:**
   - Go to Umami Cloud → Settings → Websites
   - Click "Add Website"
   - Name: `NextBestMove`
   - Domain: `nextbestmove.app` (or `*` for all domains)
   - Copy the new Website ID
   - Update Vercel environment variable
   - Redeploy

2. **Check Umami Cloud Status:**
   - Visit https://status.umami.is (if available)
   - Check Umami Cloud documentation for known issues

3. **Contact Support:**
   - Umami Cloud support (if using cloud version)
   - Or check Umami GitHub issues if self-hosted

## Expected Behavior When Working

When Umami is configured correctly:

1. **Network Tab:**
   - POST requests to `api-gateway.umami.dev/api/send`
   - Status: `200 OK`
   - Response contains event data

2. **Umami Dashboard:**
   - Page views appear within 1-2 minutes
   - Real-time view shows current visitors
   - Events appear in Events tab (if tracking custom events)

3. **Browser Console:**
   - No errors related to Umami
   - Script loads successfully from `cloud.umami.is/script.js`

