// GlitchTip uses the same SDK as Sentry, so we use @sentry/nextjs
// Configure with GlitchTip DSN instead of Sentry DSN

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_GLITCHTIP_DSN;

// Debug logging (only in production to avoid spam)
if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
  console.log("[GlitchTip] Initializing...", {
    hasDsn: !!dsn,
    dsnPrefix: dsn ? dsn.substring(0, 30) + "..." : "missing",
    environment: process.env.NODE_ENV,
  });
}

Sentry.init({
  dsn: dsn || undefined,
  
  // Reduce trace sampling to minimize events (was 0.1, now 0.01 = 1%)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.01 : 0,

  // DISABLE session replay - it's very event-heavy and we're hitting limits
  // Only enable if upgrading GlitchTip plan
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Sample errors - only send 50% of errors to stay within free tier limits
  // Adjust this based on your needs (0.5 = 50%, 0.1 = 10%, etc.)
  sampleRate: process.env.NODE_ENV === "production" ? 0.5 : 0,

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production" && !!dsn,

  environment: process.env.NODE_ENV || "development",
  
  // Debug mode disabled to reduce noise
  debug: false,

  // Reduce breadcrumbs to minimize events
  maxBreadcrumbs: 10, // Reduced from default 100

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
    "fetch failed",
    // Stripe errors that are handled
    "StripeInvalidRequestError",
    // Common non-critical errors
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
  ],

  beforeSend(event, hint) {
    // Don't send errors in development
    if (process.env.NODE_ENV === "development") {
      console.error("[GlitchTip] Error captured (not sent in dev):", event);
      return null;
    }
    
    // Log in production for debugging
    console.log("[GlitchTip] Sending error to GlitchTip:", {
      message: event.message,
      level: event.level,
      url: event.request?.url,
    });
    
    return event;
  },
  
  // Add transport options to see network requests
  transportOptions: {
    // This will help debug network issues
  },
});

// Expose Sentry on window for manual testing and debugging
if (typeof window !== "undefined") {
  (window as typeof window & { Sentry: typeof Sentry }).Sentry = Sentry;
  
  // Log when Sentry is available
  if (process.env.NODE_ENV === "production") {
    console.log("[GlitchTip] Sentry exposed on window.Sentry for testing");
  }
}

