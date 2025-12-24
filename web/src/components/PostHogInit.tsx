"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

/**
 * PostHog Analytics Initialization
 * 
 * Initializes PostHog for product analytics and event tracking.
 * Only initializes if NEXT_PUBLIC_POSTHOG_KEY is configured.
 */
export function PostHogInit() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";

    // Don't initialize if PostHog is not configured
    if (!posthogKey) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[PostHog] Tracking not configured. Set NEXT_PUBLIC_POSTHOG_KEY");
      }
      return;
    }

    // Initialize PostHog
    if (typeof window !== "undefined") {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        loaded: (posthog) => {
          if (process.env.NODE_ENV === "development") {
            console.log("[PostHog] Initialized successfully");
          }
        },
        // Privacy settings
        autocapture: true, // Automatically capture clicks, form submissions, etc.
        capture_pageview: true, // Automatically capture page views
        capture_pageleave: false, // Don't capture page leave events (privacy)
        // Disable in development to avoid noise
        disable_session_recording: process.env.NODE_ENV === "development",
      });
    }
  }, []);

  // Track page views on route changes
  useEffect(() => {
    if (pathname && typeof window !== "undefined" && posthog.__loaded) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + "?" + searchParams.toString();
      }
      posthog.capture("$pageview", {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

