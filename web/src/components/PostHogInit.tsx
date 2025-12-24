"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import posthog from "posthog-js";

/**
 * PostHog Page View Tracker
 * 
 * Tracks page views on route changes. Must be wrapped in Suspense
 * because it uses useSearchParams().
 */
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

/**
 * PostHog Analytics Initialization
 * 
 * Initializes PostHog for product analytics and event tracking.
 * Only initializes if NEXT_PUBLIC_POSTHOG_KEY is configured.
 */
function PostHogInitInner() {
  useEffect(() => {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";

    // Don't initialize if PostHog is not configured
    if (!posthogKey) {
      console.warn("[PostHog] Tracking not configured. Set NEXT_PUBLIC_POSTHOG_KEY");
      return;
    }

    // Initialize PostHog
    if (typeof window !== "undefined") {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        loaded: (posthog) => {
          console.log("[PostHog] Initialized successfully");
        },
        // Privacy settings
        autocapture: true, // Automatically capture clicks, form submissions, etc.
        capture_pageview: false, // We'll track page views manually via PostHogPageView
        capture_pageleave: false, // Don't capture page leave events (privacy)
        // Disable in development to avoid noise
        disable_session_recording: process.env.NODE_ENV === "development",
      });
    }
  }, []);

  return null;
}

/**
 * PostHog Analytics Component
 * 
 * Wraps the page view tracker in Suspense to satisfy Next.js requirements.
 */
export function PostHogInit() {
  return (
    <>
      <PostHogInitInner />
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
    </>
  );
}

