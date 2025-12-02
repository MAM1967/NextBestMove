# GlitchTip Network Test

## Step 1: Open Browser DevTools

1. Open your app in production
2. Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
3. Go to the **Network** tab
4. Filter by `glitchtip` or `app.glitchtip.com`

## Step 2: Trigger a Test Error

Run this in the browser console:

```javascript
// Test 1: Direct Sentry capture (if available)
if (window.Sentry) {
  console.log("✅ Sentry found on window");
  window.Sentry.captureException(new Error("GlitchTip network test"));
} else {
  console.log("❌ Sentry not on window, trying import...");
  
  // Test 2: Import Sentry dynamically
  import("@sentry/nextjs").then((Sentry) => {
    console.log("✅ Sentry imported");
    Sentry.captureException(new Error("GlitchTip network test via import"));
  }).catch((err) => {
    console.error("❌ Failed to import Sentry:", err);
  });
}

// Test 3: Throw an error (should be caught by global handler)
setTimeout(() => {
  throw new Error("GlitchTip test - unhandled error");
}, 1000);
```

## Step 3: Check Network Requests

**Look for POST requests to:**
- `https://app.glitchtip.com/api/...`
- `https://f192e61a926c4f8e9d757b7c42a8a4f6@app.glitchtip.com/...`

**Check the request:**
1. **Status Code:**
   - `200` = Success ✅
   - `401` = Authentication failed ❌
   - `403` = Forbidden ❌
   - `CORS error` = CORS issue ❌

2. **Request Payload:**
   - Should contain error details
   - Should have DSN in headers

3. **Response:**
   - Should return an event ID if successful

## Step 4: Check Console Logs

Look for these messages:
- `[GlitchTip] Sending error to GlitchTip:` - This means `beforeSend` was called
- `[GlitchTip] ✅ SDK loaded successfully` - SDK is initialized

## Common Issues

### No Network Requests Appear

**Possible causes:**
1. SDK not enabled (check `enabled: true` in config)
2. Errors being filtered out (`ignoreErrors` or `beforeSend` returning `null`)
3. DSN not set correctly

**Fix:**
- Check `sentry.client.config.ts` - ensure `enabled: process.env.NODE_ENV === "production" && !!dsn`
- Check browser console for `[GlitchTip] Initializing...` log
- Verify DSN in Vercel environment variables

### Network Request Returns 401/403

**Possible causes:**
1. Invalid DSN
2. GlitchTip project not found
3. API key mismatch

**Fix:**
- Verify DSN matches GlitchTip dashboard exactly: `https://f192e61a926c4f8e9d757b7c42a8a4f6@app.glitchtip.com/13904`
- Check for trailing whitespace/newlines in DSN
- Verify project ID `13904` is correct in GlitchTip

### CORS Error

**Possible causes:**
1. GlitchTip CORS settings
2. DSN domain mismatch

**Fix:**
- Check GlitchTip project settings → CORS
- Verify DSN domain matches your GlitchTip instance URL

### Request Succeeds But No Issue in Dashboard

**Possible causes:**
1. Issue deduplication (same error already exists)
2. Delay in dashboard update
3. Wrong project selected

**Fix:**
- Wait 30-60 seconds for dashboard to update
- Check if issue already exists (might be deduplicated)
- Verify you're looking at the correct project in GlitchTip dashboard
- Try a unique error message: `new Error("Test " + Date.now())`

## Quick Diagnostic Script

Run this in the browser console:

```javascript
(async () => {
  console.log("=== GlitchTip Diagnostic ===");
  
  // Check Sentry on window
  const windowSentry = (window as any).Sentry;
  console.log("1. window.Sentry:", windowSentry ? "✅ Found" : "❌ Not found");
  
  // Try to import Sentry
  try {
    const Sentry = await import("@sentry/nextjs");
    console.log("2. Sentry import:", Sentry ? "✅ Success" : "❌ Failed");
    
    // Check if client is initialized
    const client = Sentry.getCurrentHub()?.getClient();
    console.log("3. Sentry client:", client ? "✅ Initialized" : "❌ Not initialized");
    
    if (client) {
      const options = client.getOptions();
      console.log("4. DSN:", options.dsn ? `✅ ${options.dsn.substring(0, 50)}...` : "❌ Not set");
      console.log("5. Enabled:", options.enabled ? "✅ Yes" : "❌ No");
      console.log("6. Environment:", options.environment || "❌ Not set");
      
      // Try to capture an error
      const eventId = Sentry.captureException(new Error("Diagnostic test " + Date.now()));
      console.log("7. Capture result:", eventId ? `✅ Event ID: ${eventId}` : "❌ Failed");
    }
  } catch (err) {
    console.error("❌ Import failed:", err);
  }
  
  console.log("=== Check Network tab for POST requests to app.glitchtip.com ===");
})();
```

