# Server Action Error Troubleshooting

## Error: "UnrecognizedActionError: Server Action was not found"

This error occurs when the client-side JavaScript bundle is trying to call a server action that doesn't exist or has changed. This is common after deployments.

### Quick Fixes

1. **Hard Refresh Browser**
   - Mac: `Cmd + Shift + R`
   - Windows/Linux: `Ctrl + Shift + R`
   - This forces the browser to reload the JavaScript bundle

2. **Clear Browser Cache**
   - Open DevTools (F12)
   - Right-click the refresh button → "Empty Cache and Hard Reload"
   - Or clear site data for `nextbestmove.app`

3. **Use Incognito/Private Window**
   - This bypasses all cache
   - If it works in incognito, it's a cache issue

4. **Wait for Deployment**
   - Check Vercel Dashboard → Deployments
   - Ensure latest deployment shows "Ready"
   - Wait 1-2 minutes after "Ready" for CDN propagation

### Root Causes

1. **Browser Cache**
   - Old JavaScript bundle cached in browser
   - Solution: Hard refresh or clear cache

2. **Deployment Still In Progress**
   - Server action not yet available
   - Solution: Wait for deployment to complete

3. **Build Failure**
   - Server action not included in build
   - Solution: Check Vercel build logs for errors

4. **CDN Propagation Delay**
   - New build not yet propagated to all edge locations
   - Solution: Wait a few minutes

### Prevention

- Always hard refresh after deployments when testing
- Use versioned URLs for critical actions (if needed)
- Monitor Vercel build logs for errors

---

_Last updated: January 29, 2025_

