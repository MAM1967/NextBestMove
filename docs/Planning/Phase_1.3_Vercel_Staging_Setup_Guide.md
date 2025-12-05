# Phase 1.3: Vercel Staging Configuration Guide

**Status:** 📋 In Progress  
**Estimated Time:** 1 hour

---

## Overview

Configure Vercel to deploy the `staging` branch to a staging domain with all necessary environment variables.

---

## Step 1: Configure Staging Domain in Vercel

### 1.1 Add Staging Domain

1. Go to your Vercel project dashboard
2. Navigate to: **Settings → Domains**
3. Click **"Add Domain"**
4. Enter: `staging.nextbestmove.app`
5. Click **"Add"**

### 1.2 Assign Staging Branch

1. After adding the domain, you'll see domain configuration options
2. Under **"Git Branch"**, select: `staging`
3. This ensures only the `staging` branch deploys to this domain

### 1.3 DNS Configuration

Vercel will provide DNS instructions. You'll need to add a CNAME record:

- **Type:** CNAME
- **Name:** `staging`
- **Value:** `cname.vercel-dns.com` (or the value Vercel provides)
- **TTL:** 3600 (or default)

Add this in your domain registrar's DNS settings (where `nextbestmove.app` is registered).

**Note:** DNS propagation can take a few minutes to 24 hours.

---

## Step 2: Set Up Environment Variables

### 2.1 Navigate to Environment Variables

1. Go to: **Settings → Environment Variables**
2. You'll add variables scoped to **"Preview"** or **"Staging"** branch

### 2.2 Environment Variables Checklist

Add each variable with the appropriate scope (Preview/Staging branch):

#### Supabase (Staging) - ✅ Already Have These

- [ ] `NEXT_PUBLIC_SUPABASE_URL`

  - Value: `https://adgiptzbxnzddbgfeuut.supabase.co`
  - Scope: **Preview**

- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`

  - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZ2lwdHpieG56ZGRiZ2ZldXV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4Nzk0MzIsImV4cCI6MjA4MDQ1NTQzMn0.ux0Hwx3zKUDqjYz1_6nJJqSQ8lHUkezcLl-m8VDZWUQ`
  - Scope: **Preview**

- [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZ2lwdHpieG56ZGRiZ2ZldXV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg3OTQzMiwiZXhwIjoyMDgwNDU1NDMyfQ.-JUP_rXGxxxyv6Rk0ThtCZYZou_d33zuGJU33xy6eoo`
  - Scope: **Preview**

#### Application URL

- [ ] `NEXT_PUBLIC_APP_URL`
  - Value: `https://staging.nextbestmove.app`
  - Scope: **Preview**

#### Stripe (Test Mode) - ⚠️ Need to Get These

- [ ] `STRIPE_SECRET_KEY`

  - Value: `sk_test_...` (Stripe test mode secret key)
  - Scope: **Preview**
  - **How to get:** Stripe Dashboard → Developers → API keys → Test mode

- [ ] `STRIPE_WEBHOOK_SECRET`

  - Value: `whsec_...` (Stripe webhook signing secret for staging)
  - Scope: **Preview**
  - **How to get:** Create webhook endpoint in Stripe (see Step 3)

- [ ] `STRIPE_PRICE_ID_STANDARD_MONTHLY`

  - Value: `price_...` (Test mode price ID)
  - Scope: **Preview**
  - **How to get:** Stripe Dashboard → Products → Copy test price ID

- [ ] `STRIPE_PRICE_ID_STANDARD_YEARLY`

  - Value: `price_...` (Test mode price ID)
  - Scope: **Preview**

- [ ] `STRIPE_PRICE_ID_PREMIUM_MONTHLY`

  - Value: `price_...` (Test mode price ID)
  - Scope: **Preview**
  - **Note:** May be called "Professional" in Stripe

- [ ] `STRIPE_PRICE_ID_PREMIUM_YEARLY`
  - Value: `price_...` (Test mode price ID)
  - Scope: **Preview**

#### Email (Resend)

- [ ] `RESEND_API_KEY`
  - Value: `re_...` (Resend API key)
  - Scope: **Preview**
  - **Note:** Can use same key as production, or create separate key

#### Cron Jobs

- [ ] `CRON_SECRET`

  - Value: Generate a random secret (e.g., `openssl rand -hex 32`)
  - Scope: **Preview**
  - **How to generate:** `openssl rand -hex 32` or use a password generator

- [ ] `CRON_JOB_ORG_API_KEY` (if using cron-job.org)
  - Value: Your cron-job.org API key
  - Scope: **Preview**

#### Analytics & Monitoring

- [ ] `NEXT_PUBLIC_UMAMI_WEBSITE_ID`

  - Value: Create a new website in Umami for staging
  - Scope: **Preview**
  - **How to get:** Umami Dashboard → Add Website → Copy Website ID

- [ ] `NEXT_PUBLIC_GLITCHTIP_DSN` or `GLITCHTIP_DSN`
  - Value: Create a new project in GlitchTip for staging
  - Scope: **Preview**
  - **How to get:** GlitchTip Dashboard → Create Project → Copy DSN

#### AI (OpenAI)

- [ ] `OPENAI_API_KEY`
  - Value: Your OpenAI API key
  - Scope: **Preview**
  - **Note:** Can use same key as production, or separate key

#### Calendar OAuth (if testing calendar features)

- [ ] `GOOGLE_CLIENT_ID`

  - Value: Google OAuth client ID
  - Scope: **Preview**

- [ ] `GOOGLE_CLIENT_SECRET`

  - Value: Google OAuth client secret
  - Scope: **Preview**

- [ ] `OUTLOOK_CLIENT_ID`

  - Value: Azure/Outlook OAuth client ID
  - Scope: **Preview**

- [ ] `OUTLOOK_CLIENT_SECRET`

  - Value: Azure/Outlook OAuth client secret
  - Scope: **Preview**

- [ ] `OUTLOOK_TENANT_ID`
  - Value: Azure tenant ID
  - Scope: **Preview**

#### Encryption

- [ ] `CALENDAR_ENCRYPTION_KEY`
  - Value: Calendar encryption key (same as production or generate new)
  - Scope: **Preview**

#### Staging Security (Optional - for password protection)

- [ ] `STAGING_USER`

  - Value: Username for staging password protection
  - Scope: **Preview**
  - **Note:** Only needed if implementing password protection

- [ ] `STAGING_PASS`
  - Value: Password for staging password protection
  - Scope: **Preview**
  - **Note:** Only needed if implementing password protection

---

## Step 3: Configure Stripe Test Mode Webhook

### 3.1 Create Webhook Endpoint in Stripe

1. Go to: Stripe Dashboard → Developers → Webhooks
2. Click **"Add endpoint"**
3. **Endpoint URL:** `https://staging.nextbestmove.app/api/billing/webhook`
4. **Description:** "NextBestMove Staging Webhook"
5. **Events to send:** Select all billing events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
   - (Select all relevant billing events)
6. Click **"Add endpoint"**
7. **Copy the "Signing secret"** (starts with `whsec_...`)
8. Add this as `STRIPE_WEBHOOK_SECRET` in Vercel

### 3.2 Create Test Products & Prices

1. Go to: Stripe Dashboard → Products
2. Make sure you're in **Test mode** (toggle in top right)
3. Create or verify these products exist:
   - **Standard Plan** (Monthly: $29, Yearly: $249)
   - **Premium/Professional Plan** (Monthly: $79, Yearly: $649)
4. Copy the **Price IDs** (start with `price_...`)
5. Add these to Vercel environment variables

---

## Step 4: Configure Deployment Settings

### 4.1 Automatic Deployments

1. Go to: **Settings → Git**
2. Verify **"Automatic deployments"** is enabled
3. The `staging` branch should automatically deploy when pushed

### 4.2 Build Settings (if needed)

1. Go to: **Settings → General**
2. Verify build settings:
   - **Framework Preset:** Next.js
   - **Build Command:** (default, usually `next build`)
   - **Install Command:** (default, usually `npm install` or `pnpm install`)
   - **Root Directory:** `web` (if your Next.js app is in a subdirectory)

---

## Step 5: Test Staging Deployment

### 5.1 Trigger a Deployment

1. Make a small change to the `staging` branch (or push existing changes)
2. Vercel should automatically detect and deploy

### 5.2 Verify Deployment

1. Go to: **Deployments** tab in Vercel
2. Find the latest deployment from `staging` branch
3. Click on it to see deployment details
4. Verify:
   - Build completed successfully
   - Environment variables are loaded
   - Deployment is live

### 5.3 Test Staging Site

1. Once DNS is propagated, visit: `https://staging.nextbestmove.app`
2. Verify the site loads
3. Test sign-in with one of your staging users
4. Check browser console for any errors

---

## Verification Checklist

- [ ] Staging domain added in Vercel
- [ ] Domain assigned to `staging` branch
- [ ] DNS CNAME record added (or in progress)
- [ ] All Supabase environment variables set
- [ ] All Stripe test mode variables set
- [ ] Stripe webhook endpoint created
- [ ] All other environment variables set
- [ ] Test deployment successful
- [ ] Staging site accessible (after DNS propagation)
- [ ] Can sign in with staging users
- [ ] No console errors

---

## Troubleshooting

### DNS Not Working

- Wait 24-48 hours for DNS propagation
- Check DNS records with: `dig staging.nextbestmove.app` or `nslookup staging.nextbestmove.app`
- Verify CNAME record is correct

### Environment Variables Not Loading

- Verify variables are scoped to "Preview" branch
- Redeploy after adding variables
- Check deployment logs for variable loading

### Build Failures

- Check build logs in Vercel
- Verify all required environment variables are set
- Check for TypeScript/linting errors

---

## Next Steps

After completing Phase 1.3:

1. ✅ Move to Phase 1.4: Staging Security (password protection)
2. ✅ Or continue with Phase 1.5: Stripe Test Mode Setup (if not done)

---

**Last Updated:** January 2025
