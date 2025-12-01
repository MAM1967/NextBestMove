# GlitchTip Quick Diagnostic Checklist

## Immediate Checks

### 1. Is the DSN set?

Check Vercel environment variables:
- Go to Vercel Dashboard → Project → Settings → Environment Variables
- Look for `NEXT_PUBLIC_GLITCHTIP_DSN`
- ✅ Should be set for Production environment
- ✅ Format: `https://key@domain.com/project-id`

### 2. Are you testing in production?

GlitchTip is **disabled in development** by design.

**Check:**
- Are you testing on `nextbestmove.app` (production)?
- Or `localhost` (development - won't work)?

**To test:**
- Deploy to production/staging
- Or temporarily enable in dev (not recommended)

### 3. Check browser console

Open DevTools Console (F12) and look for:

**Good signs:**
- No Sentry/GlitchTip errors
- Errors captured silently

**Bad signs:**
- `Sentry is not initialized`
- `Failed to send event`
- CORS errors

### 4. Test error capture

Add this temporarily to trigger a test error:

```typescript
// In any component or API route
import { logError } from "@/lib/utils/logger";

// Trigger a test error
logError("Test GlitchTip error", new Error("Testing GlitchTip connection"));
```

Then check GlitchTip dashboard → Issues tab

### 5. Check GlitchTip dashboard

1. Log into https://app.glitchtip.com
2. Go to your project
3. Check **Issues** tab - do you see any errors?
4. Check **Settings** → **Client Keys** - verify DSN matches
5. Check **Settings** → **Rate Limits** - have you exceeded 1,000/month?

---

## Most Common Issues

### Issue: "Nothing appears in GlitchTip"

**Most likely causes:**
1. Testing in development (GlitchTip disabled)
2. DSN not set in Vercel
3. Wrong DSN format
4. Rate limit exceeded

**Quick fix:**
1. Verify DSN in Vercel
2. Test in production environment
3. Check GlitchTip dashboard for rate limits

### Issue: "CORS errors"

**Fix:**
- Verify DSN domain matches your GlitchTip instance
- Check if GlitchTip instance is accessible
- Verify domain allows requests from your app

### Issue: "Events sent but not showing"

**Fix:**
- Check GlitchTip dashboard filters
- Verify correct project selected
- Refresh dashboard
- Check if events are being grouped

---

## Quick Test Script

Run this in browser console (on production site):

```javascript
// Test GlitchTip connection
if (window.Sentry) {
  console.log("✅ Sentry/GlitchTip SDK loaded");
  window.Sentry.captureException(new Error("Test GlitchTip error"));
  console.log("✅ Test error sent - check GlitchTip dashboard");
} else {
  console.error("❌ Sentry/GlitchTip SDK not loaded");
}
```

---

## Still Not Working?

Share these details:
1. Are you testing in production or development?
2. Is `NEXT_PUBLIC_GLITCHTIP_DSN` set in Vercel?
3. What errors (if any) appear in browser console?
4. Do you see any events in GlitchTip dashboard?
5. What's your GlitchTip DSN format? (you can mask the key)

