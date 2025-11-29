# Vercel Environment Variables Troubleshooting

## Problem: `RESEND_API_KEY is not set` Error

If you're seeing this error even though you've added the key to Vercel, follow these steps:

### Step 1: Verify the Key is Set

After deploying, visit:
```
https://nextbestmove.app/api/check-env
```

This will show you which environment variables are set (without revealing their values).

### Step 2: Check Vercel Dashboard

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Verify `RESEND_API_KEY` is listed
3. Check that it's set for **Production** environment (not just Preview/Development)
4. Verify the value starts with `re_` (Resend API keys always start with `re_`)

### Step 3: Common Issues

#### Issue 1: Key Added But Not Redeployed

**Problem:** You added the key but didn't trigger a new deployment.

**Solution:**
1. Go to **Vercel Dashboard** → **Deployments**
2. Click **"Redeploy"** on the latest deployment
3. Or make a small change and push to trigger a new deployment

#### Issue 2: Key Added to Wrong Environment

**Problem:** The key is set for "Preview" or "Development" but not "Production".

**Solution:**
1. In **Environment Variables**, check the environment dropdown
2. Make sure `RESEND_API_KEY` is set for **Production**
3. If it's only set for Preview/Development, add it for Production too

#### Issue 3: Typo in Variable Name

**Problem:** The variable name has a typo (e.g., `RESEND_API_KE` instead of `RESEND_API_KEY`).

**Solution:**
1. Check the exact variable name in Vercel
2. It must be exactly: `RESEND_API_KEY` (case-sensitive)
3. Delete the incorrect one and add the correct one

#### Issue 4: Extra Whitespace

**Problem:** The key value has leading/trailing spaces.

**Solution:**
1. Edit the variable in Vercel
2. Copy the key value
3. Paste it into a text editor and remove any spaces
4. Copy it back and save

#### Issue 5: Key Not Saved

**Problem:** You entered the key but didn't click "Save".

**Solution:**
1. Make sure you clicked **"Save"** after entering the key
2. The key should appear in the list below

### Step 4: Verify After Fix

1. **Redeploy** the application (or wait for the next deployment)
2. Visit `https://nextbestmove.app/api/check-env`
3. Check that `RESEND_API_KEY` shows as `✅ Set`
4. Try sending a password reset email again

## Quick Checklist

- [ ] `RESEND_API_KEY` is in Vercel Environment Variables
- [ ] Key is set for **Production** environment
- [ ] Variable name is exactly `RESEND_API_KEY` (no typos)
- [ ] Key value starts with `re_`
- [ ] Application has been redeployed after adding the key
- [ ] `/api/check-env` shows the key as set

## Testing Locally

To test locally, add to `web/.env.local`:
```
RESEND_API_KEY=re_your_key_here
```

Then restart your dev server:
```bash
cd web
npm run dev
```

## Still Not Working?

If the key is set correctly in Vercel and you've redeployed, but it's still not working:

1. Check Vercel logs for the exact error message
2. Verify the key is active in Resend dashboard (https://resend.com/api-keys)
3. Make sure the key has permission to send emails
4. Check that the domain `nextbestmove.app` is verified in Resend

---

_Last updated: January 29, 2025_

