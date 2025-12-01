# GlitchTip DSN Verification Steps

## Critical: Verify DSN is Set in Vercel

The most common reason GlitchTip doesn't work is that the DSN isn't set in Vercel environment variables.

### Step 1: Check Vercel Environment Variables

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select your project: **next-best-move**
3. Go to **Settings** → **Environment Variables**
4. Look for: `NEXT_PUBLIC_GLITCHTIP_DSN`
5. ✅ **Must be set for Production environment**
6. ✅ **Value should be exactly:** `https://f192e61a926c4f8e9d757b7c42a8a4f6@app.glitchtip.com/13904`

### Step 2: Verify DSN Format

Your DSN from GlitchTip dashboard should be:
```
https://f192e61a926c4f8e9d757b7c42a8a4f6@app.glitchtip.com/13904
```

**Common mistakes:**
- ❌ Missing `https://` prefix
- ❌ Wrong domain (should be `app.glitchtip.com`)
- ❌ Wrong project ID (should be `13904`)
- ❌ Trailing whitespace or newlines
- ❌ Using Security Endpoint instead of DSN

### Step 3: Check Network Tab

After deploying, check browser Network tab:

1. Open DevTools (F12)
2. Go to **Network** tab
3. Filter by: `sentry` or `glitchtip`
4. Reload the page
5. Look for: `sentry.client.config.js` or similar files

**If you see `sentry.client.config.js`:**
- ✅ Config file is being loaded
- Check if it contains your DSN

**If you DON'T see it:**
- ❌ Config file isn't being loaded
- This means the SDK isn't initializing

### Step 4: Verify DSN in Browser

After deploying, run this in browser console:

```javascript
// Check if DSN is available
console.log("DSN available:", !!process.env.NEXT_PUBLIC_GLITCHTIP_DSN);

// If available, show first 30 chars (don't log full DSN)
if (process.env.NEXT_PUBLIC_GLITCHTIP_DSN) {
  console.log("DSN prefix:", process.env.NEXT_PUBLIC_GLITCHTIP_DSN.substring(0, 30) + "...");
} else {
  console.error("❌ DSN NOT AVAILABLE - Check Vercel environment variables");
}
```

### Step 5: Manual DSN Check

If DSN is not available, verify in Vercel:

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Find `NEXT_PUBLIC_GLITCHTIP_DSN`
3. **If it doesn't exist:**
   - Click "Add New"
   - Key: `NEXT_PUBLIC_GLITCHTIP_DSN`
   - Value: `https://f192e61a926c4f8e9d757b7c42a8a4f6@app.glitchtip.com/13904`
   - Environment: **Production** (and Preview/Development if needed)
   - Click "Save"
4. **If it exists but wrong:**
   - Click "Edit"
   - Update value to match GlitchTip dashboard exactly
   - Remove any trailing whitespace
   - Click "Save"
5. **Redeploy** after adding/updating

### Step 6: Verify After Redeploy

After redeploying with DSN set:

1. Wait for deployment to complete
2. Visit production site: `nextbestmove.app`
3. Open browser console
4. You should see: `[GlitchTip] Initializing...` or `[GlitchTip] SDK loaded successfully`
5. Run diagnostic script again
6. Should now show: `✅ Sentry SDK is loaded`

---

## Quick Checklist

- [ ] `NEXT_PUBLIC_GLITCHTIP_DSN` exists in Vercel
- [ ] DSN value matches GlitchTip dashboard exactly
- [ ] DSN is set for Production environment
- [ ] No trailing whitespace/newlines in DSN
- [ ] Redeployed after setting DSN
- [ ] Browser console shows initialization message
- [ ] Diagnostic script shows SDK loaded

---

## Still Not Working?

If DSN is set correctly and SDK still doesn't load:

1. **Check browser console** for any errors
2. **Check Network tab** for failed requests
3. **Verify GlitchTip project** is active (not paused)
4. **Check rate limits** (free tier: 1,000 events/month)
5. **Try different browser** (ad blockers can block Sentry)

