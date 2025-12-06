# Step-by-Step: Fix Preview Environment Variables in Vercel

## Problem
Preview deployments are using Production Supabase values instead of Staging values.

## Solution: Delete and Recreate Preview Variables

### Step 1: Delete Preview-Scoped Variables
1. Go to: https://vercel.com/michael-mcdermotts-projects/next-best-move/settings/environment-variables
2. In the search bar, type "Supa" to filter
3. Use the scope filter dropdown and select **"Preview and Development"**
4. You should see:
   - `NEXT_PUBLIC_SUPABASE_URL` (Preview and Development)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Preview and Development)
5. For each variable:
   - Click the three dots (⋯) on the right
   - Click "Delete"
   - Confirm deletion

### Step 2: Recreate `NEXT_PUBLIC_SUPABASE_URL`
1. Click "Add New" button
2. **Key:** `NEXT_PUBLIC_SUPABASE_URL`
3. **Value:** `https://adgiptzbxnzddbgfeuut.supabase.co`
4. **Environment:** 
   - ✅ Check "Preview"
   - ✅ Check "Development"
   - ❌ Do NOT check "Production"
5. Click "Save"

### Step 3: Recreate `NEXT_PUBLIC_SUPABASE_ANON_KEY`
1. Click "Add New" button
2. **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZ2lwdHpieG56ZGRiZ2ZldXV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4Nzk0MzIsImV4cCI6MjA4MDQ1NTQzMn0.ux0Hwx3zKUDqjYz1_6nJJqSQ8lHUkezcLl-m8VDZWUQ`
4. **Environment:**
   - ✅ Check "Preview"
   - ✅ Check "Development"
   - ❌ Do NOT check "Production"
5. Click "Save"

### Step 4: Verify Variables
1. Filter to "Preview and Development" again
2. Verify both variables are there with correct values
3. Verify their scope shows "Preview and Development" (not "Production, Preview, Development")

### Step 5: Trigger New Deployment
**Option A: Push a trivial commit**
```bash
cd /Users/michaelmcdermott/NextBestMove
echo "" >> .gitignore
git add .gitignore
git commit -m "Trigger rebuild after fixing Preview env vars"
git push origin staging
```

**Option B: Redeploy from Dashboard**
1. Go to Vercel Dashboard → Deployments
2. Find the latest Preview deployment
3. Click the three dots (⋯)
4. Click "Redeploy"

### Step 6: Verify Build Logs
After the new deployment, check the build logs. You should see:
```
🔍 Build Environment Debug:
   VERCEL_ENV: preview
   NEXT_PUBLIC_SUPABASE_URL from process.env: https://adgiptzbxnzddbgfeuut.supabase.co...
   Detected project ID: adgiptzbxnzddbgfeuut
✅ Preview/Staging build validated: Using Supabase project adgiptzbxnzddbgfeuut
```

If you still see `lilhqhbbougkblznspow`, the variables weren't properly recreated. Try deleting and recreating again.

