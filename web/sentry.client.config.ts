// GlitchTip uses the same SDK as Sentry, so we use @sentry/nextjs
// Configure with GlitchTip DSN instead of Sentry DSN

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_GLITCHTIP_DSN;

Sentry.init({
  dsn: dsn || undefined,
  
  // Set tracesSampleRate to 1.0 to capture 100% of transactions
  // Reduce in production if needed
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Capture Replay for 10% of all sessions,
  // plus 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production" && !!dsn,

  environment: process.env.NODE_ENV || "development",

  // Filter out known non-critical errors
  ignoreErrors: [
    // Browser extensions
    "top.GLOBALS",
    "originalCreateNotification",
    "canvas.contentDocument",
    "MyApp_RemoveAllHighlights",
    "atomicFindClose",
    // Network errors that are expected
    "NetworkError",
    "Failed to fetch",
    // Stripe errors that are handled
    "StripeInvalidRequestError",
  ],

  beforeSend(event, hint) {
    // Don't send errors in development
    if (process.env.NODE_ENV === "development") {
      console.error("[GlitchTip] Error captured (not sent in dev):", event);
      return null;
    }
    return event;
  },
});

