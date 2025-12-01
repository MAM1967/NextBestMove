# Observability Setup Guide

This document describes the observability tools configured for NextBestMove.

## Overview

The application uses three main observability tools:

1. **Sentry** - Error tracking and performance monitoring
2. **PostHog** - Product analytics and event tracking
3. **Structured Logging** - Centralized logging utility for billing and webhooks

## Sentry Configuration

### Setup

1. Create a Sentry account at https://sentry.io
2. Create a new project for Next.js
3. Get your DSN from the project settings
4. Add to `.env.local`:
   ```
   NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
   SENTRY_ORG=your_org_slug
   SENTRY_PROJECT=your_project_slug
   ```

### Files

- `sentry.client.config.ts` - Client-side configuration
- `sentry.server.config.ts` - Server-side configuration
- `sentry.edge.config.ts` - Edge runtime configuration
- `next.config.ts` - Wrapped with `withSentryConfig`

### Usage

Errors are automatically captured. For manual error tracking:

```typescript
import { logError } from "@/lib/utils/logger";

try {
  // your code
} catch (error) {
  logError("Failed to process action", error, { actionId: "123" });
}
```

## PostHog Configuration

### Setup

1. Create a PostHog account at https://posthog.com
2. Get your API key from project settings
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key_here
   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com  # Optional, defaults to this
   ```

### Usage

PostHog is automatically initialized. To track custom events:

```typescript
import { trackEvent, identifyUser } from "@/lib/analytics/posthog";

// Track an event
trackEvent("action_completed", {
  actionType: "FOLLOW_UP",
  userId: "user-123",
});

// Identify a user (call after login)
identifyUser("user-123", {
  email: "user@example.com",
  plan: "standard",
});
```

## Structured Logging

### Usage

The logger utility provides structured logging with Sentry integration:

```typescript
import { logInfo, logWarn, logError, logBillingEvent, logWebhookEvent } from "@/lib/utils/logger";

// General logging
logInfo("User logged in", { userId: "123" });
logWarn("Rate limit approaching", { userId: "123", requests: 95 });
logError("Failed to save action", error, { actionId: "456" });

// Billing-specific logging
logBillingEvent("subscription.created", {
  userId: "123",
  customerId: "cus_abc",
  subscriptionId: "sub_xyz",
  amount: 2900,
  currency: "usd",
});

// Webhook-specific logging
logWebhookEvent("webhook.received", {
  webhookType: "stripe",
  eventId: "evt_123",
  status: "success",
});
```

## Environment Variables

Add these to your `.env.local` file:

```bash
# Sentry
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_org_slug
SENTRY_PROJECT=your_project_slug

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com  # Optional
```

## Production Considerations

1. **Sentry**:**
   - Adjust `tracesSampleRate` in production (currently 1.0 for development)
   - Consider reducing `replaysSessionSampleRate` to save quota
   - Enable source maps for better error tracking

2. **PostHog**:**
   - Disable `autocapture` in production for privacy
   - Review data retention settings
   - Set up feature flags if needed

3. **Logging**:**
   - All logs go to console + Sentry breadcrumbs
   - Consider adding a log aggregation service (e.g., Datadog, LogRocket) for production

## Testing

To verify observability is working:

1. **Sentry**: Trigger an error and check Sentry dashboard
2. **PostHog**: Track a test event and verify in PostHog dashboard
3. **Logging**: Check console output and Sentry breadcrumbs

