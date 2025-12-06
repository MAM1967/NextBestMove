# Vercel Environment Variable Scoping Check

## Problem
The build is using the production Supabase project (`lilhqhbbougkblznspow`) even though Preview-scoped variables are set to staging (`adgiptzbxnzddbgfeuut`).

## Root Cause
`NEXT_PUBLIC_*` environment variables are embedded at **build time** in Next.js. If Vercel uses Production-scoped or unscoped variables during the build, they get baked into the build.

## Solution: Verify Variable Scoping in Vercel

### Step 1: Check Variable Scopes
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Look for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Check the "Scope" column** for each variable

### Step 2: Expected Configuration

**For Staging (Preview deployments):**
- `NEXT_PUBLIC_SUPABASE_URL` should be scoped to **"Preview"** (or "Preview, Development")
- Value should be: `https://adgiptzbxnzddbgfeuut.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` should be scoped to **"Preview"** (or "Preview, Development")
- Value should be the staging anon key

**For Production:**
- `NEXT_PUBLIC_SUPABASE_URL` should be scoped to **"Production"** (or "Production, Preview, Development")
- Value should be: `https://lilhqhbbougkblznspow.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` should be scoped to **"Production"** (or "Production, Preview, Development")
- Value should be the production anon key

### Step 3: Common Issues

**Issue 1: Unscoped Variables (Apply to All Environments)**
- If a variable has no scope or is scoped to "All", it applies to **all** environments
- If you have an unscoped variable with production values, it will override Preview-scoped variables
- **Fix:** Delete unscoped variables or change their scope to "Production" only

**Issue 2: Production Variables Override Preview**
- If a variable is scoped to "Production, Preview", the production value will be used for Preview builds
- **Fix:** Create separate variables:
  - One scoped to "Production" only with production values
  - One scoped to "Preview" only with staging values

**Issue 3: Wrong Variable Names**
- Make sure variables are named exactly:
  - `NEXT_PUBLIC_SUPABASE_URL` (not `STAGING_SUPABASE_URL` or `SUPABASE_URL`)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (not `STAGING_SUPABASE_ANON_KEY` or `SUPABASE_ANON_KEY`)

### Step 4: Build-Time Validation
The build will now **fail** if the wrong Supabase project is detected:
- Production builds must use `lilhqhbbougkblznspow`
- Preview/Staging builds must use `adgiptzbxnzddbgfeuut`

If the build fails with a project ID mismatch, check your Vercel environment variable scoping.

### Step 5: After Fixing Variables
1. **Redeploy** the Preview deployment (or push a new commit to trigger a new build)
2. Check the build logs - you should see:
   ```
   ✅ Preview/Staging build validated: Using Supabase project adgiptzbxnzddbgfeuut
   ```
3. Verify the debug endpoint:
   ```
   https://staging.nextbestmove.app/api/debug-env
   ```
   Should show: `"supabaseProjectId": "adgiptzbxnzddbgfeuut"`

## Quick Checklist
- [ ] `NEXT_PUBLIC_SUPABASE_URL` exists with Preview scope
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` exists with Preview scope
- [ ] Preview-scoped variables have staging values (`adgiptzbxnzddbgfeuut`)
- [ ] No unscoped variables with production values
- [ ] Production-scoped variables are separate from Preview-scoped variables
- [ ] Build logs show correct project ID validation
- [ ] Debug endpoint shows staging project ID

