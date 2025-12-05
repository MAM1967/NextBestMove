# Fix Basic Auth Password Issue

**Problem:** Basic Auth prompt appears, but password isn't working.

---

## Common Causes

### 1. **Whitespace in Environment Variables** (Most Common)
Vercel sometimes adds trailing/leading spaces when you paste values.

**Solution:** 
- Go to Vercel Dashboard → Settings → Environment Variables
- Edit `STAGING_USER` and `STAGING_PASS`
- **Remove any spaces** before/after the values
- Save and redeploy

### 2. **Case Sensitivity**
Passwords are case-sensitive.

**Solution:**
- Verify exact case matches
- Check for typos

### 3. **Special Characters**
Some special characters might be encoded differently.

**Solution:**
- Use simple alphanumeric passwords for staging
- Or verify encoding matches

---

## Debug Steps

### Step 1: Check Credential Configuration

After deploying the latest fix, visit:
```
https://staging.nextbestmove.app/api/check-credentials
```

This will show:
- Length of username and password
- First character of each (to verify)
- Whether whitespace trimming is needed

### Step 2: Check Vercel Environment Variables

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Click on `STAGING_USER` → **Edit**
3. Check for any spaces before/after the value
4. Remove spaces if present
5. Repeat for `STAGING_PASS`
6. **Save** both
7. **Redeploy** (environment variables are baked into the build)

### Step 3: Verify Exact Values

**In Vercel Dashboard:**
- `STAGING_USER` should be exactly: `staging` (or your chosen username)
- `STAGING_PASS` should be exactly: `[your-password]` (no extra spaces)

**When entering in browser:**
- Username: exactly `staging` (or your chosen username)
- Password: exactly `[your-password]` (no extra spaces)

---

## What the Fix Does

The latest code update:
1. ✅ Trims whitespace from environment variables
2. ✅ Trims whitespace from user input
3. ✅ Adds debug logging for mismatches
4. ✅ Creates debug endpoint to verify config

**But you still need to:**
- Remove any spaces in Vercel environment variables
- Redeploy after fixing

---

## Quick Fix

1. **Edit environment variables in Vercel:**
   - Remove any leading/trailing spaces
   - Save

2. **Redeploy:**
   - Push a commit, OR
   - Manually redeploy from Vercel Dashboard

3. **Test:**
   - Visit `https://staging.nextbestmove.app` in incognito
   - Enter credentials (no spaces)
   - Should work!

---

## Still Not Working?

1. **Check the debug endpoint:**
   - Visit `/api/check-credentials`
   - Verify lengths match what you expect

2. **Check Vercel function logs:**
   - Look for `[Middleware] Basic Auth failed:` logs
   - Shows length mismatches

3. **Try a simple password:**
   - Temporarily set `STAGING_PASS` to something simple like `test123`
   - Redeploy and test
   - If that works, the issue is with special characters in your password

---

**The fix is deployed - just need to clean up any whitespace in Vercel env vars!**

