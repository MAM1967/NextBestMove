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
  
  // Debug mode to see what's happening
  debug: process.env.NODE_ENV === "production" && !!dsn,

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

