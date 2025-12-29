# Fix "Invalid API key" Error in Cron Jobs

## Problem

Cron jobs are returning `500 Internal Server Error` with message: `"Invalid API key"` from Supabase.

**Logs show:**

- ✅ Authentication working (Authorization header received)
- ✅ Supabase URL correct: `https://adgiptzbxnzddbgfeuut.supabase.co` (staging)
- ❌ Supabase service role key is invalid

---

## Root Cause

`SUPABASE_SERVICE_ROLE_KEY` in Vercel Preview scope is either:

1. Not set
2. Set to production key instead of staging key
3. Has formatting issues (whitespace, truncation)

---

## Solution: Update SUPABASE_SERVICE_ROLE_KEY in Vercel

### Step 1: Get Staging Service Role Key

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select project: **`nextbestmove-staging`** (project ID: `adgiptzbxnzddbgfeuut`)
3. Go to **Settings** → **API**
4. Find **`service_role` key** (under "Project API keys")
5. Click **Reveal** to show the full key
6. Copy the entire key (should start with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

**Expected Staging Service Role Key:**

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZ2lwdHpieG56ZGRiZ2ZldXV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg3OTQzMiwiZXhwIjoyMDgwNDU1NDMyfQ.-JUP_rXGxxxyv6Rk0ThtCZYZou_d33zuGJU33xy6eoo
```

⚠️ **IMPORTANT:** This is the staging key. Do NOT use the production key.

---

### Step 2: Update in Vercel

1. Go to **Vercel Dashboard**: https://vercel.com/dashboard
2. Select project: **NextBestMove**
3. Go to **Settings** → **Environment Variables**
4. Filter by **Preview** scope (click "Preview" button)
5. Find `SUPABASE_SERVICE_ROLE_KEY`:

   - If it exists: Click **Edit** (three dots menu)
   - If it doesn't exist: Click **Add New**

6. **Update the value:**

   - **Key:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** Paste the staging service role key from Step 1
   - **Environment:** Select **Preview** only (NOT Production, NOT Development)
   - Click **Save**

7. **Verify:**
   - The key should be ~200+ characters long
   - Should start with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`
   - Should contain `adgiptzbxnzddbgfeuut` (staging project ID) in the middle
   - No leading/trailing spaces
   - No line breaks

---

### Step 3: Redeploy Staging

Environment variable changes require a new deployment:

1. Go to **Vercel Dashboard** → **Deployments**
2. Find the latest staging deployment (should be from `staging` branch)
3. Click **Redeploy** (three dots menu → Redeploy)
4. Wait for deployment to complete (~2-3 minutes)

---

### Step 4: Test Cron Job

1. Go to **cron-job.org**
2. Find job: **[STAGING] Daily Plans**
3. Click **Run now** or **Test**
4. Check execution log:
   - ✅ Should see success (not "Invalid API key" error)
   - ✅ Should see plan generation results

---

## Verification Checklist

After updating:

- [ ] `SUPABASE_SERVICE_ROLE_KEY` exists in Vercel Preview scope
- [ ] Value matches staging service role key from Supabase
- [ ] Key starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`
- [ ] Key contains `adgiptzbxnzddbgfeuut` (staging project ID)
- [ ] No whitespace or formatting issues
- [ ] Staging deployment redeployed after update
- [ ] Cron job test succeeds

---

## Common Mistakes

### ❌ Using Production Key

**Symptom:** Key contains `lilhqhbbougkblznspow` (production project ID)
**Fix:** Use staging key with `adgiptzbxnzddbgfeuut`

### ❌ Wrong Scope

**Symptom:** Variable set in Production scope instead of Preview
**Fix:** Ensure it's in **Preview** scope only

### ❌ Truncated Key

**Symptom:** Key is shorter than expected (~100 characters instead of 200+)
**Fix:** Copy the full key from Supabase (click "Reveal")

### ❌ Whitespace Issues

**Symptom:** Key has leading/trailing spaces or line breaks
**Fix:** Remove all whitespace, ensure it's one continuous string

---

## Quick Test

After updating, you can test the endpoint manually:

```bash
curl -X GET \
  -H "Authorization: Bearer e6720e0c094fd8ba7494b27073d03c6405d9422bdc1e0af0a7e16f678f55ec83" \
  "https://staging.nextbestmove.app/api/cron/daily-plans"
```

**Expected response:**

- ✅ `{"success":true,"message":"...","generated":X}` - Success!
- ❌ `{"error":"Invalid API key"}` - Key still wrong, check Vercel again

---

## Still Not Working?

1. **Double-check Supabase project**: Ensure you're copying from `nextbestmove-staging`, not production
2. **Check Vercel logs**: After redeploy, check Functions → `/api/cron/daily-plans` for new error details
3. **Verify variable name**: Must be exactly `SUPABASE_SERVICE_ROLE_KEY` (case-sensitive)
4. **Clear browser cache**: Sometimes Vercel UI shows stale values








