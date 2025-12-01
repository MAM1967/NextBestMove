/**
 * Next.js Instrumentation Hook
 * This file is automatically executed by Next.js to initialize Sentry/GlitchTip
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server-side
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Import server config
    await import("./sentry.server.config");
  }

  // Only run on edge runtime
  if (process.env.NEXT_RUNTIME === "edge") {
    // Import edge config
    await import("./sentry.edge.config");
  }

  // Client config is loaded via GlitchTipInit component
  // No need to import here as it's client-side only
}

