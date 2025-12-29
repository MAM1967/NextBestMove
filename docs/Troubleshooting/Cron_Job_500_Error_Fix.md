# Fix Cron Job 500 Internal Server Error

## Problem
Cron jobs are returning `500 Internal Server Error` after authentication passes. This indicates a Supabase configuration issue.

## Most Likely Causes

1. **`SUPABASE_SERVICE_ROLE_KEY` not set in Vercel Preview scope**
2. **`SUPABASE_SERVICE_ROLE_KEY` set to production key instead of staging key**
3. **Key has whitespace or formatting issues**

---

## Step 1: Check Vercel Logs

1. Go to **Vercel Dashboard** → Your Project → **Deployments**
2. Click on the latest staging deployment
3. Go to **Functions** tab
4. Find `/api/cron/daily-plans` (or the failing endpoint)
5. Click on it to see execution logs
6. Look for error messages like:
   - `"SUPABASE_SERVICE_ROLE_KEY is not set"`
   - `"Invalid service role key format"`
   - `"Invalid API key"` (from Supabase)
   - `"Failed to fetch users"`

The logs will show exactly what's failing.

---

## Step 2: Verify Environment Variables in Vercel

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Filter by **Preview** scope (not Production)
3. Verify these variables exist and have correct values:

### Required Variables (Preview Scope):

| Variable Name | Expected Value (Staging) | How to Check |
|--------------|-------------------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://adgiptzbxnzddbgfeuut.supabase.co` | Should contain `adgiptzbxnzddbgfeuut` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Should be staging anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Should be staging service role key |

### Get Staging Service Role Key:

1. Go to **Supabase Dashboard** → `nextbestmove-staging` project
2. Go to **Settings** → **API**
3. Copy the **`service_role` key** (secret, not anon key)
4. It should start with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## Step 3: Fix SUPABASE_SERVICE_ROLE_KEY

### If Missing:
1. In Vercel → **Settings** → **Environment Variables**
2. Click **Add New**
3. **Key:** `SUPABASE_SERVICE_ROLE_KEY`
4. **Value:** Paste the staging service role key from Supabase
5. **Environment:** Select **Preview** only (NOT Production)
6. Click **Save**

### If Wrong Value:
1. Find `SUPABASE_SERVICE_ROLE_KEY` in the list
2. Click **Edit** (three dots menu)
3. Update the value to staging service role key
4. Ensure **Preview** scope is selected
5. Click **Save**

### If Has Whitespace:
1. Edit the variable
2. Remove any leading/trailing spaces
3. Ensure no line breaks in the middle
4. The key should be one continuous string starting with `eyJ`

---

## Step 4: Redeploy Staging

After updating environment variables:

1. Go to **Vercel Dashboard** → **Deployments**
2. Find the latest staging deployment
3. Click **Redeploy** (three dots menu)
4. Wait for deployment to complete
5. Test the cron job again

---

## Step 5: Test the Cron Job

1. Go to **cron-job.org**
2. Find the failing job (e.g., "[STAGING] Daily Plans")
3. Click **Run now** or **Test**
4. Check the execution log
5. Should see success (not 500 error)

---

## Step 6: Check Vercel Logs Again

After redeploying, check the logs again:

1. Go to **Vercel Dashboard** → Latest deployment → **Functions**
2. Find the cron endpoint
3. Check for the new debug logs we added:
   - `[Cron Daily Plans] Auth Debug:` - Shows auth status
   - `[Cron Daily Plans] Admin client creation error details:` - Shows Supabase config
   - `[Cron Daily Plans] Supabase query error details:` - Shows query errors

These logs will tell you exactly what's wrong.

---

## Common Error Messages and Fixes

### "SUPABASE_SERVICE_ROLE_KEY is not set"
**Fix:** Add the variable in Vercel Preview scope

### "Invalid service role key format"
**Fix:** 
- Ensure key starts with `eyJ`
- Remove any whitespace
- Ensure full key is copied (should be ~200+ characters)

### "Invalid API key" (from Supabase)
**Fix:**
- Verify you're using the **staging** service role key (not production)
- Staging project: `adgiptzbxnzddbgfeuut`
- Production project: `lilhqhbbougkblznspow`
- The key must match the project

### "Failed to fetch users"
**Fix:**
- Usually means wrong service role key (production key used for staging)
- Verify `NEXT_PUBLIC_SUPABASE_URL` points to staging (`adgiptzbxnzddbgfeuut`)
- Verify `SUPABASE_SERVICE_ROLE_KEY` is staging key

---

## Quick Verification Script

You can test if the environment variables are correct by calling the endpoint manually:

```bash
# Test with Authorization header
curl -X GET \
  -H "Authorization: Bearer e6720e0c094fd8ba7494b27073d03c6405d9422bdc1e0af0a7e16f678f55ec83" \
  "https://staging.nextbestmove.app/api/cron/daily-plans"
```

If you get `{"error":"Failed to fetch users","details":"Invalid API key"}`, it means:
- Authentication worked ✅
- But Supabase service role key is wrong ❌

---

## Still Not Working?

1. **Check Vercel Logs** - The detailed error logs will show exactly what's failing
2. **Verify Supabase Project** - Ensure you're using the correct staging project credentials
3. **Check for Typos** - Variable names are case-sensitive: `SUPABASE_SERVICE_ROLE_KEY` (not `SUPABASE_SERVICE_KEY`)
4. **Redeploy** - Environment variable changes require a new deployment









