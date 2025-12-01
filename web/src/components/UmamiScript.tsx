"use client";

import Script from "next/script";

export function UmamiScript() {
  const umamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL;
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

  // Don't render if Umami is not configured
  if (!umamiUrl || !websiteId) {
    return null;
  }

  return (
    <Script
      src={`${umamiUrl}/script.js`}
      data-website-id={websiteId}
      strategy="afterInteractive"
    />
  );
}

