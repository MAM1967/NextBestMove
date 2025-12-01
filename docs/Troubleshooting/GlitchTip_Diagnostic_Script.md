# GlitchTip Diagnostic Script

Run this in your browser console (on production site: `nextbestmove.app`) to diagnose GlitchTip issues:

```javascript
// GlitchTip Diagnostic Script
console.log("=== GlitchTip Diagnostic ===");

// 1. Check if Sentry SDK is loaded
if (typeof window.Sentry !== "undefined") {
  console.log("✅ Sentry SDK is loaded");
  
  // 2. Check if Sentry is initialized
  const client = window.Sentry.getClient();
  if (client) {
    console.log("✅ Sentry client is initialized");
    console.log("DSN:", client.getDsn()?.toString() || "Not set");
    console.log("Options:", {
      enabled: client.getOptions().enabled,
      environment: client.getOptions().environment,
      debug: client.getOptions().debug,
    });
  } else {
    console.error("❌ Sentry client is NOT initialized");
  }
  
  // 3. Test error capture
  console.log("Testing error capture...");
  const eventId = window.Sentry.captureException(new Error("GlitchTip diagnostic test"));
  console.log("Event ID:", eventId);
  
  // 4. Check transport (network layer)
  const transport = client?.getTransport?.();
  if (transport) {
    console.log("✅ Transport layer exists");
  } else {
    console.warn("⚠️ Transport layer not found");
  }
  
} else {
  console.error("❌ Sentry SDK is NOT loaded");
  console.log("This means sentry.client.config.ts is not being executed");
  console.log("Check:");
  console.log("1. Is NEXT_PUBLIC_GLITCHTIP_DSN set in Vercel?");
  console.log("2. Did you rebuild/redeploy after adding the DSN?");
  console.log("3. Check Network tab for sentry.client.config.js");
}

// 5. Check environment variable (if accessible)
if (typeof process !== "undefined" && process.env) {
  console.log("NODE_ENV:", process.env.NODE_ENV);
} else {
  console.log("process.env not accessible (normal in browser)");
}

// 6. Check for network requests
console.log("\n=== Next Steps ===");
console.log("1. Open Network tab (F12 → Network)");
console.log("2. Filter by 'glitchtip' or 'sentry'");
console.log("3. Trigger an error or reload the page");
console.log("4. Look for POST requests to app.glitchtip.com");
console.log("5. Check if requests are successful (200) or failing (CORS/401/403)");
```

## Expected Output

**If GlitchTip is working:**
```
✅ Sentry SDK is loaded
✅ Sentry client is initialized
DSN: https://f192e61a926c4f8e9d757b7c42a8a4f6@app.glitchtip.com/13904
Options: { enabled: true, environment: "production", debug: true }
✅ Transport layer exists
Event ID: abc123...
```

**If GlitchTip is NOT working:**
```
❌ Sentry SDK is NOT loaded
OR
✅ Sentry SDK is loaded
❌ Sentry client is NOT initialized
```

## Common Issues Based on Output

### "Sentry SDK is NOT loaded"
- **Cause:** Config file not being executed
- **Fix:** 
  - Verify `NEXT_PUBLIC_GLITCHTIP_DSN` is set in Vercel
  - Rebuild and redeploy
  - Check browser Network tab for `sentry.client.config.js`

### "Sentry client is NOT initialized"
- **Cause:** DSN missing or invalid
- **Fix:**
  - Check DSN format in Vercel
  - Verify DSN matches GlitchTip dashboard exactly
  - Check for trailing whitespace/newlines

### "DSN: Not set"
- **Cause:** Environment variable not available
- **Fix:**
  - Verify `NEXT_PUBLIC_GLITCHTIP_DSN` is set in Vercel
  - Must have `NEXT_PUBLIC_` prefix for client-side access
  - Redeploy after adding

### Network requests failing (CORS/401/403)
- **Cause:** GlitchTip domain/CORS issue
- **Fix:**
  - Verify DSN domain matches your GlitchTip instance
  - Check GlitchTip project settings
  - Verify API key is correct

---

## Quick Test After Fixes

After making changes, test again:

```javascript
// Quick test
window.Sentry?.captureException(new Error("Test after fix"));
```

Then check GlitchTip dashboard → Issues tab within 10-30 seconds.

