// GlitchTip edge runtime configuration

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_GLITCHTIP_DSN;

Sentry.init({
  dsn: dsn || undefined,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production" && !!dsn,

  environment: process.env.NODE_ENV || "development",
});

