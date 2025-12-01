/**
 * Umami Analytics Integration
 * 
 * Umami is a privacy-focused, open-source analytics platform.
 * This utility provides functions to track events and page views.
 */

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, string | number | boolean>) => void;
    };
  }
}

/**
 * Track a custom event
 * 
 * @param eventName - Name of the event (e.g., "button_clicked", "plan_generated")
 * @param eventData - Optional event properties (e.g., { plan_type: "standard", user_id: "123" })
 */
export function trackEvent(
  eventName: string,
  eventData?: Record<string, string | number | boolean>
): void {
  if (typeof window === "undefined") {
    // Server-side rendering - skip tracking
    return;
  }

  if (!window.umami) {
    console.warn("[Umami] Tracking script not loaded");
    return;
  }

  try {
    window.umami.track(eventName, eventData);
  } catch (error) {
    console.error("[Umami] Failed to track event:", error);
  }
}

/**
 * Track a page view (usually automatic, but can be called manually)
 * 
 * @param url - Optional URL to track (defaults to current page)
 */
export function trackPageView(url?: string): void {
  if (typeof window === "undefined") {
    return;
  }

  // Umami automatically tracks page views, but we can trigger manually if needed
  if (url) {
    trackEvent("page_view", { url });
  }
}

/**
 * Identify a user (for user-specific analytics)
 * 
 * Note: Umami doesn't have a built-in identify function like PostHog,
 * but we can track user-specific events with user_id in event data.
 * 
 * @param userId - User ID to associate with events
 * @param userProperties - Optional user properties
 */
export function identifyUser(
  userId: string,
  userProperties?: Record<string, string | number | boolean>
): void {
  // Track a user_identified event with user data
  trackEvent("user_identified", {
    user_id: userId,
    ...userProperties,
  });
}

