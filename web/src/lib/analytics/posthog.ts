/**
 * PostHog analytics integration
 * Provides product analytics and event tracking
 */

"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

let isInitialized = false;

/**
 * Initialize PostHog (call once in app)
 */
export function initPostHog() {
  if (typeof window === "undefined" || isInitialized) {
    return;
  }

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

  if (!apiKey) {
    console.warn("PostHog API key not found. Analytics disabled.");
    return;
  }

  posthog.init(apiKey, {
    api_host: host,
    loaded: (posthog) => {
      if (process.env.NODE_ENV === "development") {
        console.log("PostHog initialized");
      }
    },
    // Disable autocapture in production for privacy
    autocapture: process.env.NODE_ENV === "development",
    // Capture pageviews automatically
    capture_pageview: true,
    capture_pageleave: true,
  });

  isInitialized = true;
}

/**
 * Track a custom event
 */
export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined" || !isInitialized) {
    return;
  }

  posthog.capture(eventName, properties);
}

/**
 * Identify a user
 */
export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined" || !isInitialized) {
    return;
  }

  posthog.identify(userId, properties);
}

/**
 * Reset user (call on logout)
 */
export function resetUser() {
  if (typeof window === "undefined" || !isInitialized) {
    return;
  }

  posthog.reset();
}

/**
 * React hook to initialize PostHog
 */
export function usePostHog() {
  useEffect(() => {
    initPostHog();
  }, []);
}

