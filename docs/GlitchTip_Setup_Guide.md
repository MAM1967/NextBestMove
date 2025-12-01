# GlitchTip Error Tracking Setup Guide

This guide explains how to set up GlitchTip error tracking for NextBestMove.

## Overview

GlitchTip is an open-source, Sentry-compatible error tracking platform that provides:
- Automatic error capture
- Error grouping and aggregation
- Stack traces with source maps
- User context tracking
- Performance monitoring

## Prerequisites

1. GlitchTip account (free tier available at https://glitchtip.com)
2. Project created in GlitchTip
3. DSN (Data Source Name) from GlitchTip dashboard

## Setup Steps

### 1. Get Your GlitchTip DSN

1. Log into GlitchTip: https://app.glitchtip.com
2. Go to your project
3. Navigate to **Settings** → **Client Keys (DSN)**
4. Copy your DSN (format: `https://key@domain.com/project-id`)

**Your DSN:**
```
https://f192e61a926c4f8e9d757b7c42a8a4f6@app.glitchtip.com/13904
```

### 2. Configure Environment Variables

Add to your `.env.local` file:

```bash
# GlitchTip Error Tracking
NEXT_PUBLIC_GLITCHTIP_DSN=https://f192e61a926c4f8e9d757b7c42a8a4f6@app.glitchtip.com/13904
```

### 3. Add to Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `NEXT_PUBLIC_GLITCHTIP_DSN` = `https://f192e61a926c4f8e9d757b7c42a8a4f6@app.glitchtip.com/13904`
2. Set for **Production**, **Preview**, and **Development** environments
3. Redeploy your application

### 4. Verify Installation

1. Deploy your changes
2. Trigger a test error (or wait for a real error)
3. Check GlitchTip dashboard - errors should appear within seconds
4. Verify error details include stack traces and context

## Usage

### Automatic Error Capture

GlitchTip automatically captures:
- Unhandled exceptions
- Unhandled promise rejections
- React component errors (via Error Boundaries)

### Manual Error Logging

Use the logger utility for structured error logging:

```typescript
import { logError } from "@/lib/utils/logger";

try {
  // your code
} catch (error) {
  logError("Failed to process action", error, {
    actionId: "123",
    userId: user.id,
    context: "action_processing",
  });
}
```

### Adding User Context

Set user context for better error tracking:

```typescript
import * as Sentry from "@sentry/nextjs";

// After user logs in
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});

// Clear on logout
Sentry.setUser(null);
```

### Adding Breadcrumbs

Add breadcrumbs to track user actions leading to errors:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.addBreadcrumb({
  message: "User clicked subscribe button",
  category: "user_action",
  level: "info",
  data: {
    plan: "standard",
    interval: "month",
  },
});
```

## Configuration Files

- `sentry.client.config.ts` - Client-side configuration
- `sentry.server.config.ts` - Server-side configuration
- `sentry.edge.config.ts` - Edge runtime configuration
- `next.config.ts` - Wrapped with Sentry config for source maps

## Error Filtering

The configuration filters out known non-critical errors:
- Browser extension errors
- Network errors (handled gracefully)
- Stripe errors (handled with user feedback)

## Development vs Production

- **Development**: Errors are logged to console but NOT sent to GlitchTip
- **Production**: Errors are sent to GlitchTip automatically

This prevents cluttering GlitchTip with development errors.

## Performance Monitoring

GlitchTip automatically tracks:
- Page load times
- API route performance
- Database query times (if instrumented)

## Troubleshooting

### Errors Not Appearing in GlitchTip

1. **Check Environment Variable:**
   - Verify `NEXT_PUBLIC_GLITCHTIP_DSN` is set correctly
   - Ensure it's prefixed with `NEXT_PUBLIC_` (required for client-side)
   - Check for trailing whitespace/newlines

2. **Check GlitchTip Dashboard:**
   - Verify project is active
   - Check DSN matches your environment variable
   - Ensure you're looking at the correct project

3. **Check Browser Console:**
   - Look for GlitchTip initialization errors
   - Verify script is loading

4. **Development Mode:**
   - Errors are NOT sent in development (by design)
   - Test in production/preview environment

### Source Maps Not Working

1. **Check Build Configuration:**
   - Source maps are generated automatically
   - Verify `hideSourceMaps: false` in `next.config.ts`

2. **Check GlitchTip Settings:**
   - Ensure source maps are enabled in project settings
   - Verify upload is working

## Best Practices

1. **Use Structured Logging:**
   ```typescript
   logError("Action failed", error, {
     actionId: "123",
     userId: user.id,
     context: "specific_context",
   });
   ```

2. **Add User Context:**
   - Set user context after login
   - Clear on logout
   - Helps identify which users are affected

3. **Add Breadcrumbs:**
   - Track important user actions
   - Helps debug error paths

4. **Filter Known Errors:**
   - Add expected errors to `ignoreErrors` in config
   - Prevents noise in error tracking

## Integration with Logger Utility

The `logError` function automatically sends errors to GlitchTip:

```typescript
// This automatically sends to GlitchTip
logError("Payment failed", error, {
  userId: user.id,
  customerId: customer.id,
  amount: 2900,
});
```

## Resources

- [GlitchTip Documentation](https://glitchtip.com/documentation)
- [Sentry SDK Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/) (GlitchTip uses same SDK)
- [GlitchTip Free Tier](https://glitchtip.com/pricing)

