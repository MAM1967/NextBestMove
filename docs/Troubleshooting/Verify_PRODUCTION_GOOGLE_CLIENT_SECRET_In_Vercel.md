# Verify PRODUCTION_GOOGLE_CLIENT_SECRET in Vercel

## Problem
The debug logs show that `PRODUCTION_GOOGLE_CLIENT_SECRET` is NOT available at runtime, even though it was added to Vercel.

**Debug output:**
```
Available env vars with 'GOOGLE' or 'PRODUCTION': GOOGLE_CLIENT_ID=..., GOOGLE_CLIENT_SECRET=..., VERCEL_PROJECT_PRODUCTION_URL=...
```

Notice: `PRODUCTION_GOOGLE_CLIENT_SECRET` is **missing** from the list.

---

## Step 1: Verify Variable Exists in Vercel

1. **Go to Vercel Dashboard:**
   - Your Project → **Settings** → **Environment Variables**

2. **Search for the variable:**
   - Type `PRODUCTION_GOOGLE_CLIENT_SECRET` in the search box
   - It should appear in the list

3. **Check the details:**
   - **Name:** Must be exactly `PRODUCTION_GOOGLE_CLIENT_SECRET` (case-sensitive, no spaces)
   - **Environment:** Must be set to **Production** only (or "Production, Preview, Development" if you want it everywhere)
   - **Value:** Should be the production client secret (starts with `GOCSPX-UDm3Gmo4XLoGH...`)

---

## Step 2: Common Issues

### Issue 1: Variable Name Typo
**Check for:**
- Extra spaces: `PRODUCTION_GOOGLE_CLIENT_SECRET ` (trailing space)
- Wrong case: `production_google_client_secret` (should be uppercase)
- Missing underscore: `PRODUCTIONGOOGLE_CLIENT_SECRET`

**Fix:** Delete and recreate with exact name: `PRODUCTION_GOOGLE_CLIENT_SECRET`

### Issue 2: Wrong Environment Scope
**Check:**
- Is it set to "Production" only?
- Or is it set to "Preview" or "Development" only?

**Fix:** 
- Click on the variable → Edit
- Make sure "Production" is checked
- Save

### Issue 3: Variable Added After Deployment
**Check:**
- When was the variable added?
- Was it added AFTER the last production deployment?

**Fix:**
- Variables added after deployment won't be available until next deployment
- **Redeploy production** after adding the variable

### Issue 4: Vercel Bug - Variable Not Passed to Runtime
**Symptom:** Variable exists in Vercel UI, but not available at runtime (this is what we're seeing)

**Possible fixes:**
1. **Delete and recreate the variable:**
   - Delete `PRODUCTION_GOOGLE_CLIENT_SECRET`
   - Add it again with the exact same name
   - Redeploy

2. **Try a different variable name:**
   - Sometimes Vercel has issues with certain variable names
   - Try: `GOOGLE_CLIENT_SECRET_PRODUCTION` instead

3. **Check for duplicate variables:**
   - Make sure there's only ONE `PRODUCTION_GOOGLE_CLIENT_SECRET`
   - No duplicates with different scopes

---

## Step 3: Verify After Fix

After fixing, redeploy and check logs again. You should see:

```
Available env vars with 'GOOGLE' or 'PRODUCTION': GOOGLE_CLIENT_ID=..., GOOGLE_CLIENT_SECRET=..., PRODUCTION_GOOGLE_CLIENT_SECRET=GOCSPX-UDm3Gmo4XLoGH..., VERCEL_PROJECT_PRODUCTION_URL=...
```

Notice: `PRODUCTION_GOOGLE_CLIENT_SECRET` should now appear in the list.

---

## Quick Checklist

- [ ] Variable name is exactly: `PRODUCTION_GOOGLE_CLIENT_SECRET` (no typos, no spaces)
- [ ] Variable is set to **Production** scope (or all environments)
- [ ] Variable value is the production client secret (starts with `GOCSPX-UDm3Gmo4XLoGH...`)
- [ ] Variable was added BEFORE the deployment (or redeploy after adding)
- [ ] Only ONE variable with this name exists
- [ ] Redeployed production after adding/updating the variable
- [ ] Checked logs - variable now appears in "Available env vars" list

---

## If Still Not Working

If the variable still doesn't appear after all these steps, it's likely a Vercel bug. In that case, we may need to:
1. Use a different variable name
2. Or hardcode it (but GitHub will block this due to secret scanning)

Let me know what you find when checking the Vercel UI!









