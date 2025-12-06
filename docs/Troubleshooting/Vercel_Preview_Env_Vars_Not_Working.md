# Vercel Preview Environment Variables Not Working - Known Issue & Solutions

## Problem
Preview deployments are using Production-scoped environment variables instead of Preview-scoped variables, even though Preview-scoped variables are correctly configured in the Vercel dashboard.

## Confirmed Symptoms
- `VERCEL_ENV: preview` ✅ (correctly detected)
- `isPreview: true` ✅ (correctly detected)
- But `process.env.NEXT_PUBLIC_SUPABASE_URL` contains production value ❌ (wrong!)

## Root Causes (Based on Community Reports)

### 1. **Build Cache Retaining Old Values**
Vercel's build cache can retain old environment variable values, causing deployments to use outdated configurations.

### 2. **UI Inconsistencies**
There are reports of environment variables not displaying correctly in the Vercel UI, even though they are set. The variables may appear correct in the dashboard but not be applied during builds.

### 3. **Variable Scoping Issues**
Variables may be incorrectly scoped or there may be unscoped variables that override Preview-scoped ones.

## Solutions (Try in Order)

### Solution 1: Force Fresh Build (Most Common Fix)

**Option A: Using Vercel CLI**
```bash
cd web
vercel --force
```

**Option B: Clear Build Cache via UI**
1. Go to Vercel Dashboard → Your Project → Settings → General
2. Look for "Build Cache" or "Remote Caching" section
3. If available, clear the cache
4. Trigger a new deployment

**Option C: Make Trivial Commit**
```bash
# Make a trivial change to force rebuild
echo "" >> web/.gitignore
git add web/.gitignore
git commit -m "Force rebuild to clear env var cache"
git push origin staging
```

### Solution 2: Delete and Recreate Preview Variables

Sometimes Vercel's UI has issues where variables appear correct but aren't actually applied. Recreating them forces Vercel to properly register them.

1. **Delete Preview-scoped variables:**
   - Go to Vercel → Settings → Environment Variables
   - Filter to "Preview and Development"
   - Delete `NEXT_PUBLIC_SUPABASE_URL` (Preview-scoped)
   - Delete `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Preview-scoped)

2. **Recreate them:**
   - Click "Add New"
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://adgiptzbxnzddbgfeuut.supabase.co`
   - **Scope: Select ONLY "Preview" and "Development"** (do NOT select "Production")
   - Save

   - Click "Add New" again
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZ2lwdHpieG56ZGRiZ2ZldXV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4Nzk0MzIsImV4cCI6MjA4MDQ1NTQzMn0.ux0Hwx3zKUDqjYz1_6nJJqSQ8lHUkezcLl-m8VDZWUQ`
   - **Scope: Select ONLY "Preview" and "Development"** (do NOT select "Production")
   - Save

3. **Trigger new deployment** (push a commit or redeploy)

### Solution 3: Check for Unscoped Variables

Unscoped variables (no scope or "All" scope) apply to ALL environments and can override Preview-scoped variables.

1. Go to Vercel → Settings → Environment Variables
2. Remove all filters (show all variables)
3. Look for `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` with:
   - No scope listed (blank)
   - Scope set to "All" or "Production, Preview, Development"
4. If found, either:
   - Delete them (if you have separate Production and Preview variables)
   - Or change their scope to "Production" only

### Solution 4: Verify Variable Names

Ensure variables are named exactly:
- `NEXT_PUBLIC_SUPABASE_URL` (not `STAGING_SUPABASE_URL` or `SUPABASE_URL`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (not `STAGING_SUPABASE_ANON_KEY` or `SUPABASE_ANON_KEY`)

### Solution 5: Use Vercel CLI to Pull and Verify

```bash
cd web
vercel env pull .env.vercel
cat .env.vercel | grep NEXT_PUBLIC_SUPABASE
```

This will show you what Vercel CLI sees. If it shows production values, the variables aren't correctly scoped in Vercel.

### Solution 6: Contact Vercel Support

If none of the above work, this may be a Vercel platform bug. Contact Vercel support with:
- Your project name
- The debug output showing `VERCEL_ENV: preview` but production values
- Screenshots of your Preview-scoped variables in the dashboard

## Prevention: Build-Time Validation

We've implemented build-time validation that will **fail the build** if the wrong Supabase project is detected. This prevents silent failures and forces you to fix the environment variable configuration before deployment.

## Verification

After applying a solution, check the build logs. You should see:
```
🔍 Build Environment Debug:
   VERCEL_ENV: preview
   NEXT_PUBLIC_SUPABASE_URL from process.env: https://adgiptzbxnzddbgfeuut.supabase.co...
   Detected project ID: adgiptzbxnzddbgfeuut
✅ Preview/Staging build validated: Using Supabase project adgiptzbxnzddbgfeuut
```

## References

- [Vercel Environment Variables Documentation](https://vercel.com/docs/projects/environment-variables)
- [Vercel Community Discussion on Environment Variables](https://community.vercel.com/t/vercel-environment-variables-disappearing-in-the-ui/28991)
- [GitHub Discussion on Next.js Environment Variable Loading](https://github.com/vercel/vercel/discussions/8719)

