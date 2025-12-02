# GlitchTip Troubleshooting Guide

## Quick Diagnostics

### 1. Check Environment Variable

Verify `NEXT_PUBLIC_GLITCHTIP_DSN` is set in Vercel:

```bash
# Check if it's set (should show your DSN)
echo $NEXT_PUBLIC_GLITCHTIP_DSN
```

**Expected format:**

```
https://your-key@your-glitchtip-domain.com/project-id
```

**Common issues:**

- ❌ Missing `NEXT_PUBLIC_` prefix (won't be available client-side)
- ❌ DSN has trailing whitespace/newlines
- ❌ DSN is incorrect format

---

### 2. Check Browser Console

Open browser DevTools Console and look for:

**If GlitchTip is working:**

- No errors related to Sentry/GlitchTip
- Errors should be captured silently

**If GlitchTip is NOT working:**

- `[GlitchTip] Error captured (not sent in dev):` - This is normal in development
- `Sentry is not initialized` - DSN missing or invalid
- `Failed to send event` - Network/DSN issue
- CORS errors - GlitchTip domain not allowing requests

---

### 3. Verify DSN Format

Your GlitchTip DSN should look like:

```
https://abc123def456@glitchtip.com/789
```

**Where to find it:**

1. Log into GlitchTip: https://app.glitchtip.com
2. Go to your project
3. Navigate to **Settings** → **Client Keys (DSN)**
4. Copy the DSN

**Common mistakes:**

- Using API key instead of DSN
- Missing `https://` prefix
- Wrong project ID

---

### 4. Check Production vs Development

GlitchTip is **disabled in development** by design. Check:

```typescript
// In sentry.client.config.ts
enabled: process.env.NODE_ENV === "production" && !!dsn,
```

**To test in development:**

1. Temporarily change to: `enabled: !!dsn,`
2. Or test in production/staging environment

---

### 5. Test Error Capture

**Manual test in production:**

1. Add a test error button to your app (temporary):

```typescript
// In a component
const testError = () => {
  throw new Error("Test GlitchTip error");
};
```

2. Click the button
3. Check GlitchTip dashboard for the error

**Or trigger via logger:**

```typescript
import { logError } from "@/lib/utils/logger";

logError("Test error", new Error("Testing GlitchTip"));
```

---

### 6. Check Network Requests

Open browser DevTools → Network tab:

1. Filter by "glitchtip" or "sentry"
2. Trigger an error
3. Look for POST requests to GlitchTip domain

**If you see requests:**

- ✅ GlitchTip is receiving errors
- Check GlitchTip dashboard for events

**If you don't see requests:**

- ❌ DSN might be wrong
- ❌ GlitchTip might be disabled
- ❌ Network/CORS issue

---

### 7. Verify GlitchTip Project Settings

In GlitchTip dashboard:

1. **Project Settings** → **Client Keys**

   - Verify DSN matches your env var
   - Check if key is active/enabled

2. **Project Settings** → **Rate Limits**

   - Check if you've hit rate limits
   - Free tier: 1,000 events/month

3. **Project** → **Issues**
   - Check if errors are appearing but not showing
   - Check filters/search

---

### 8. Common Issues & Fixes

#### Issue: "Sentry is not initialized"

**Fix:**

- Check `NEXT_PUBLIC_GLITCHTIP_DSN` is set
- Verify DSN format is correct
- Ensure environment variable is available at build time

#### Issue: "CORS error" or "Failed to fetch"

**Fix:**

- Check GlitchTip domain allows requests from your domain
- Verify DSN domain matches your GlitchTip instance
- Check if GlitchTip instance is accessible

#### Issue: "No events in GlitchTip dashboard"

**Possible causes:**

- Errors only sent in production (check `NODE_ENV`)
- DSN is incorrect
- Rate limit exceeded
- GlitchTip project is paused/disabled

**Fix:**

- Verify `NODE_ENV === "production"`
- Double-check DSN format
- Check GlitchTip dashboard for rate limits
- Verify project is active

#### Issue: "Events sent but not showing"

**Fix:**

- Check GlitchTip dashboard filters
- Verify you're looking at the correct project
- Check if events are being grouped/filtered
- Refresh GlitchTip dashboard

---

### 9. Debug Steps

**Step 1: Verify DSN is loaded**

Add temporary logging:

```typescript
// In sentry.client.config.ts
console.log("GlitchTip DSN:", dsn ? "Set" : "Missing");
console.log("NODE_ENV:", process.env.NODE_ENV);
```

**Step 2: Test error capture**

```typescript
// In a component or API route
import * as Sentry from "@sentry/nextjs";

try {
  throw new Error("Test GlitchTip");
} catch (error) {
  Sentry.captureException(error);
  console.log("Error sent to GlitchTip");
}
```

**Step 3: Check GlitchTip dashboard**

1. Go to your GlitchTip project
2. Check **Issues** tab
3. Look for recent errors
4. Check **Events** tab for raw events

---

### 10. Quick Fix Checklist

- [ ] `NEXT_PUBLIC_GLITCHTIP_DSN` is set in Vercel
- [ ] DSN format is correct (`https://key@domain.com/project-id`)
- [ ] Testing in production environment (not development)
- [ ] GlitchTip project is active
- [ ] Not exceeded rate limits (1,000/month free tier)
- [ ] No CORS errors in browser console
- [ ] Network requests are reaching GlitchTip
- [ ] GlitchTip dashboard shows the project

---

## Still Not Working?

1. **Check Vercel logs** for Sentry/GlitchTip errors
2. **Verify DSN** by copying it directly from GlitchTip dashboard
3. **Test with curl** to verify GlitchTip is accessible:
   ```bash
   curl -X POST https://your-glitchtip-domain.com/api/0/store/ \
     -H "Content-Type: application/json" \
     -d '{"dsn":"your-dsn-here"}'
   ```
4. **Contact GlitchTip support** if instance is self-hosted

---

_Last updated: January 2025_
