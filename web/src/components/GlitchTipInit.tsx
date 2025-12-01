"use client";

// This component ensures GlitchTip (Sentry SDK) is initialized on the client side
// Import the config file to trigger initialization
import "../../sentry.client.config";

export function GlitchTipInit() {
  // This component doesn't render anything, it just ensures the config is imported
  return null;
}

