"use client";

import Script from "next/script";
import { useEffect } from "react";

export function UmamiScript() {
  const umamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL?.trim();
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim();

  // Don't render if Umami is not configured
  if (!umamiUrl || !websiteId) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Umami] Tracking not configured. Set NEXT_PUBLIC_UMAMI_URL and NEXT_PUBLIC_UMAMI_WEBSITE_ID");
    }
    return null;
  }

  // Validate Website ID format (should be UUID)
  const isValidWebsiteId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(websiteId);
  
  useEffect(() => {
    if (!isValidWebsiteId) {
      console.error("[Umami] Invalid Website ID format. Expected UUID format (e.g., ef97f9ec-8da6-4e4f-9bcf-730a9b0cb27d)");
      console.error("[Umami] Current Website ID:", websiteId);
    }
    
    // Log configuration in production for debugging
    if (process.env.NODE_ENV === "production") {
      console.log("[Umami] Configuration:", {
        url: umamiUrl,
        websiteId: websiteId?.substring(0, 8) + "...",
        isValidFormat: isValidWebsiteId,
      });
    }
  }, [umamiUrl, websiteId, isValidWebsiteId]);

  // Add error handler for script loading
  const handleScriptError = () => {
    console.error("[Umami] Failed to load script from:", umamiUrl);
    console.error("[Umami] Check that:", {
      url: "Umami URL is correct and accessible",
      websiteId: "Website ID matches Umami dashboard",
      domain: "Domain in Umami matches your site domain",
    });
  };

  return (
    <Script
      defer
      src={`${umamiUrl}/script.js`}
      data-website-id={websiteId}
      strategy="afterInteractive"
      id="umami-script"
      onError={handleScriptError}
      onLoad={() => {
        if (process.env.NODE_ENV === "production") {
          console.log("[Umami] Script loaded successfully");
        }
      }}
    />
  );
}

