"use client";

// This component ensures GlitchTip (Sentry SDK) is initialized on the client side
// Import the config file to trigger initialization
import "../../sentry.client.config";

export function GlitchTipInit() {
  // Verify Sentry is loaded
  if (typeof window !== "undefined") {
    // Check if Sentry is available after import
    if (typeof window.Sentry === "undefined") {
      console.error("[GlitchTip] Sentry SDK not loaded after import");
      console.log("[GlitchTip] Check if DSN is set:", !!process.env.NEXT_PUBLIC_GLITCHTIP_DSN);
    } else {
      console.log("[GlitchTip] SDK loaded successfully");
    }
  }
  
  // This component doesn't render anything, it just ensures the config is imported
  return null;
}

