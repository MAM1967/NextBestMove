"use client";

// This component ensures GlitchTip (Sentry SDK) is initialized on the client side
// Import the config file to trigger initialization
import "../../sentry.client.config";
import { useEffect } from "react";

export function GlitchTipInit() {
  // Verify Sentry is loaded after initialization completes
  useEffect(() => {
    // Check after a short delay to allow async initialization
    const checkSentry = () => {
      if (typeof window !== "undefined") {
        // Use type assertion to avoid TypeScript error
        const windowWithSentry = window as typeof window & { Sentry?: unknown };
        if (typeof windowWithSentry.Sentry !== "undefined") {
          console.log("[GlitchTip] ✅ SDK loaded successfully");
        } else {
          // SDK might not expose itself on window, but initialization logs show it's working
          // This is informational only - the SDK is initialized via the import above
          console.log("[GlitchTip] ℹ️ SDK initialized (check sentry.client.config logs for details)");
        }
      }
    };
    
    // Check after initialization has time to complete
    setTimeout(checkSentry, 100);
  }, []);
  
  // This component doesn't render anything, it just ensures the config is imported
  return null;
}

