# Debugging Basic Auth Issue

**Problem:** Basic Auth not prompting after adding `STAGING_USER` and `STAGING_PASS` to Vercel.

---

## Step 1: Check Environment Variables

I've created a debug endpoint to verify environment variables are accessible:

1. **Deploy the latest code** (includes debug endpoint)
2. **Visit:** `https://staging.nextbestmove.app/api/debug-env`
3. **Check the response:**
   - `hasStagingUser: true` → Variable is accessible ✅
   - `hasStagingUser: false` → Variable not accessible ❌
   - Same for `hasStagingPass`

**Expected Response:**
```json
{
  "hostname": "staging.nextbestmove.app",
  "vercelEnv": "preview",
  "hasStagingUser": true,
  "hasStagingPass": true,
  "stagingUserLength": 7,
  "stagingPassLength": 15
}
```

---

## Step 2: Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Click on the latest staging deployment
3. Click **Functions** tab
4. Look for middleware logs (if debug logging is enabled)
5. Check for any errors

---

## Step 3: Verify Environment Variable Configuration

**In Vercel Dashboard:**

1. Go to **Settings → Environment Variables**
2. Verify `STAGING_USER` and `STAGING_PASS` are:
   - ✅ Set to **Preview and Development** (or at least **Preview**)
   - ✅ Have values (not empty)
   - ✅ Are saved (not just typed but not saved)

3. **Important:** After adding/modifying env vars, you MUST:
   - Redeploy the project (environment variables are baked into the build)
   - Or wait for the next deployment

---

## Step 4: Check Deployment Environment

**Verify the staging domain is assigned to Preview environment:**

1. Go to Vercel Dashboard → **Settings → Domains**
2. Find `staging.nextbestmove.app`
3. Check which environment it's assigned to
4. Should be **Preview** (not Production)

---

## Common Issues & Solutions

### Issue: `hasStagingUser: false` in debug endpoint

**Possible causes:**
- Environment variables not set to **Preview** scope
- Variables added after build (need to redeploy)
- Typo in variable names (`STAGING_USER` vs `STAGING_USER_`)

**Solution:**
- Double-check variable names match exactly
- Ensure scope includes **Preview**
- Redeploy after adding/modifying variables

### Issue: Variables accessible but Basic Auth still not working

**Possible causes:**
- Hostname detection not working
- Middleware not running
- Browser caching the response

**Solution:**
- Check browser console for errors
- Try incognito/private window
- Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
- Check Vercel function logs

### Issue: Basic Auth works but API routes also require it

**This shouldn't happen** - API routes are explicitly excluded.

**Solution:**
- Check middleware code (should skip `/api/*` routes)
- Verify route starts with `/api/`

---

## Next Steps

1. **Deploy the debug endpoint**
2. **Check the response** at `/api/debug-env`
3. **Share the results** so we can diagnose further

---

**The debug endpoint will tell us exactly what's happening!**

