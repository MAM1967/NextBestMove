# Environment Variables Sync: GitHub → Vercel

This guide explains how to securely store environment variables in GitHub and sync them to Vercel.

## ⚠️ Security Warning

**NEVER commit actual secrets to GitHub.** Always use:
- **GitHub Secrets** for sensitive values (API keys, tokens, etc.)
- **`.env.example`** for non-sensitive defaults and documentation

---

## Setup Options

### Option 1: GitHub Actions Workflow (Recommended)

Automatically syncs GitHub Secrets to Vercel on push to `main` or manual trigger.

#### Step 1: Add Secrets to GitHub

1. Go to your GitHub repository: `https://github.com/MAM1967/NextBestMove`
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add each secret:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `VERCEL_TOKEN` | Vercel API token | Get from Vercel Dashboard → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel organization ID | Get from Vercel Dashboard → Settings → General |
| `VERCEL_PROJECT_ID` | Vercel project ID | Get from Vercel Dashboard → Settings → General |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJ...` (JWT format) |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` or `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_...` |
| `RESEND_API_KEY` | Resend API key | `re_...` |
| `CRON_SECRET` | Cron job authentication secret | Random string |
| `OPENAI_API_KEY` | OpenAI API key (optional) | `sk-proj-...` |

#### Step 2: Get Vercel Credentials

1. **Vercel Token:**
   - Go to https://vercel.com/account/tokens
   - Click **"Create Token"**
   - Name it "GitHub Actions Sync"
   - Copy the token

2. **Vercel Org ID:**
   - Go to Vercel Dashboard → Settings → General
   - Copy the **Team ID** or **User ID**

3. **Vercel Project ID:**
   - Go to your project in Vercel Dashboard
   - Settings → General
   - Copy the **Project ID**

#### Step 3: Trigger Sync

The workflow runs automatically on push to `main`, or you can trigger it manually:

1. Go to **Actions** tab in GitHub
2. Select **"Sync Environment Variables to Vercel"**
3. Click **"Run workflow"**

---

### Option 2: Vercel CLI (Manual Sync)

For one-time or manual syncing:

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

#### Step 3: Link Project

```bash
cd web
vercel link
```

#### Step 4: Pull Current Environment Variables

```bash
vercel env pull .env.vercel
```

This creates a `.env.vercel` file with current Vercel environment variables.

#### Step 5: Push Environment Variables

```bash
# Add a single variable
vercel env add VARIABLE_NAME production

# Or use a script to sync from .env.local
# (Create a script that reads .env.local and adds each variable)
```

---

### Option 3: Vercel Dashboard (Current Method)

Continue using Vercel Dashboard for manual updates:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add/edit variables manually
3. Redeploy after changes

**Pros:** Simple, no setup required  
**Cons:** Manual, no version control, easy to forget

---

## Recommended Workflow

### For Development

1. **Local:** Use `.env.local` (gitignored)
2. **GitHub:** Store non-sensitive defaults in `.env.example`
3. **Vercel:** Set environment variables in dashboard or via CLI

### For Production

1. **GitHub Secrets:** Store all sensitive values
2. **GitHub Actions:** Automatically sync to Vercel on deploy
3. **Vercel:** Environment variables updated automatically

---

## Environment Variables Checklist

### Required for Production

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `STRIPE_PRICE_ID_STANDARD_MONTHLY`
- [ ] `STRIPE_PRICE_ID_STANDARD_YEARLY`
- [ ] `STRIPE_PRICE_ID_PROFESSIONAL_MONTHLY` (if using)
- [ ] `STRIPE_PRICE_ID_PROFESSIONAL_YEARLY` (if using)
- [ ] `NEXT_PUBLIC_APP_URL` (production URL)
- [ ] `RESEND_API_KEY`
- [ ] `CRON_SECRET`

### Optional

- [ ] `OPENAI_API_KEY` (for system AI features)

---

## Troubleshooting

### GitHub Actions Workflow Fails

**Error:** "Invalid Vercel token"
- **Fix:** Regenerate token in Vercel Dashboard → Account → Tokens

**Error:** "Project not found"
- **Fix:** Verify `VERCEL_PROJECT_ID` matches your project ID in Vercel

**Error:** "Permission denied"
- **Fix:** Ensure Vercel token has access to the project

### Variables Not Syncing

1. Check GitHub Actions logs for errors
2. Verify secrets are set correctly in GitHub
3. Manually verify in Vercel Dashboard that variables exist
4. Redeploy after syncing to ensure new variables are available

---

## Best Practices

1. **Never commit `.env.local`** - It's in `.gitignore` for a reason
2. **Use `.env.example`** - Document all required variables with placeholders
3. **Rotate secrets regularly** - Especially after team member changes
4. **Use different keys for dev/staging/prod** - Never use production keys locally
5. **Review GitHub Actions logs** - Check that syncs are working
6. **Test after syncing** - Verify variables are available in Vercel

---

## Quick Reference

### Check Current Vercel Variables

```bash
vercel env ls
```

### Add Variable via CLI

```bash
vercel env add VARIABLE_NAME production
# Paste value when prompted
```

### Remove Variable via CLI

```bash
vercel env rm VARIABLE_NAME production
```

---

_Last updated: January 29, 2025_

