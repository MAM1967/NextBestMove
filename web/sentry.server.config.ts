// GlitchTip server-side configuration

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_GLITCHTIP_DSN;

Sentry.init({
  dsn: dsn || undefined,

  // Reduce trace sampling significantly (was 0.1, now 0.01 = 1%)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.01 : 0,

  // Sample errors - only send 50% of errors to stay within free tier limits
  sampleRate: process.env.NODE_ENV === "production" ? 0.5 : 0,

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production" && !!dsn,

  environment: process.env.NODE_ENV || "development",

  // Reduce breadcrumbs
  maxBreadcrumbs: 10,

  // Filter out known non-critical errors
  ignoreErrors: [
    // Network errors
    "ECONNREFUSED",
    "ENOTFOUND",
    "ETIMEDOUT",
    // Stripe errors that are handled
    "StripeInvalidRequestError",
    // Database connection errors (handled gracefully)
    "PGRST",
  ],
});

