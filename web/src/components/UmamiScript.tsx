"use client";

import Script from "next/script";

export function UmamiScript() {
  const umamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL;
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

  // Don't render if Umami is not configured
  if (!umamiUrl || !websiteId) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Umami] Tracking not configured. Set NEXT_PUBLIC_UMAMI_URL and NEXT_PUBLIC_UMAMI_WEBSITE_ID");
    }
    return null;
  }

  return (
    <Script
      defer
      src={`${umamiUrl}/script.js`}
      data-website-id={websiteId}
      strategy="afterInteractive"
      id="umami-script"
    />
  );
}

