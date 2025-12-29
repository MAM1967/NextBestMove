# Deep Dive: Cron Job 500 Error Troubleshooting

## Current Status
- ✅ Authentication working (Authorization header received)
- ✅ Supabase URL correct (staging project)
- ❌ Still getting 500 error after setting `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 1: Check Vercel Function Logs

The most important step is to see the **actual error message** in Vercel logs:

1. Go to **Vercel Dashboard** → Your Project → **Deployments**
2. Click on the **latest staging deployment** (the one you just redeployed)
3. Go to **Functions** tab
4. Find `/api/cron/daily-plans`
5. Click on it to see execution logs
6. Look for the most recent execution (should be from your cron job test)
7. **Copy the full error message** - this will tell us exactly what's failing

**What to look for:**
- `"SUPABASE_SERVICE_ROLE_KEY is not set"` - Variable not accessible
- `"Invalid service role key format"` - Key has formatting issues
- `"Invalid API key"` - Key is wrong or doesn't match project
- `"Failed to fetch users"` - Query error (might be different issue)

---

## Step 2: Use Diagnostic Endpoint

After the next deployment completes, visit:

```
https://staging.nextbestmove.app/api/debug-supabase
```

This will show:
- Whether `SUPABASE_SERVICE_ROLE_KEY` is accessible
- The key's length and prefix
- Whether it can create an admin client
- Whether it can query Supabase

**Expected output if working:**
```json
{
  "hasServiceRoleKey": true,
  "serviceRoleKeyLength": 219,
  "serviceRoleKeyStartsWithEyJ": true,
  "serviceRoleKeyContainsStagingId": true,
  "clientCreated": true,
  "querySuccess": true
}
```

---

## Step 3: Verify Vercel Environment Variable Configuration

### Check Variable Exists:
1. Vercel Dashboard → **Settings** → **Environment Variables**
2. **Filter by Preview** (click "Preview" button)
3. Search for `SUPABASE_SERVICE_ROLE_KEY`
4. Does it exist? If not, add it.

### Check Variable Value:
1. Click **Edit** on `SUPABASE_SERVICE_ROLE_KEY`
2. **Verify the value:**
   - Should be: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZ2lwdHpieG56ZGRiZ2ZldXV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg3OTQzMiwiZXhwIjoyMDgwNDU1NDMyfQ.-JUP_rXGxxxyv6Rk0ThtCZYZou_d33zuGJU33xy6eoo`
   - Should be ~219 characters long
   - Should start with `eyJ`
   - Should contain `adgiptzbxnzddbgfeuut`

### Check Variable Scope:
1. In the edit dialog, check **Environment** dropdown
2. Should have **Preview** checked
3. Should NOT have Production checked (unless you want it there too)

### Common Issues:
- ❌ Variable in **Production** scope only (won't work for Preview deployments)
- ❌ Variable in **Development** scope only (won't work for Preview deployments)
- ❌ Variable has leading/trailing spaces
- ❌ Variable is truncated (shorter than expected)

---

## Step 4: Alternative Approaches

If setting the variable in Vercel UI isn't working, try:

### Option A: Use Vercel CLI
```bash
# Install Vercel CLI if needed
npm i -g vercel

# Set the variable
vercel env add SUPABASE_SERVICE_ROLE_KEY preview

# When prompted, paste the key value
# Then redeploy
```

### Option B: Check for Variable Name Mismatch
The code checks for both:
- `SUPABASE_SERVICE_ROLE_KEY` (primary)
- `SUPABASE_SERVICE_KEY` (fallback)

Try setting both in Vercel to be safe.

### Option C: Hardcode for Testing (Temporary)
As a last resort, we can temporarily hardcode the key in `next.config.ts` for Preview builds to verify the key itself works. This is NOT a permanent solution but helps diagnose.

---

## Step 5: Check Build vs Runtime

In Next.js, environment variables are available at runtime for API routes, but let's verify:

1. The diagnostic endpoint (`/api/debug-supabase`) will show if the variable is accessible
2. If it shows `hasServiceRoleKey: false`, the variable isn't being passed to the runtime

**Possible causes:**
- Variable not in Preview scope
- Variable name typo
- Vercel caching issue (try redeploying again)

---

## Step 6: Verify Deployment Used New Variables

1. Check deployment timestamp - should be after you updated the variable
2. If you updated the variable AFTER the deployment, you need to redeploy
3. Vercel doesn't automatically redeploy when env vars change

---

## Next Steps

1. **Check Vercel function logs** - This is the most important step
2. **Visit `/api/debug-supabase`** after next deployment
3. **Share the error message** from logs so we can diagnose further

The error message will tell us exactly what's wrong!









