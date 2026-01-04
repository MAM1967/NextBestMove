/**
 * PostHog Analytics Utilities
 * 
 * Provides type-safe event tracking functions for product analytics.
 * All events are automatically sent to PostHog if configured.
 */

import posthog from "posthog-js";

/**
 * Check if PostHog is initialized and ready
 */
export function isPostHogReady(): boolean {
  if (typeof window === "undefined") return false;
  return posthog.__loaded === true;
}

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, any>
): void {
  if (!isPostHogReady()) {
    if (process.env.NODE_ENV === "development") {
      console.log("[PostHog] Event (not sent):", eventName, properties);
    }
    return;
  }

  try {
    posthog.capture(eventName, properties);
    if (process.env.NODE_ENV === "development") {
      console.log("[PostHog] Event tracked:", eventName, properties);
    }
  } catch (error) {
    console.error("[PostHog] Error tracking event:", error);
  }
}

/**
 * Identify a user (link events to a user ID)
 */
export function identifyUser(
  userId: string,
  properties?: Record<string, any>
): void {
  if (!isPostHogReady()) {
    if (process.env.NODE_ENV === "development") {
      console.log("[PostHog] Identify (not sent):", userId, properties);
    }
    return;
  }

  try {
    posthog.identify(userId, properties);
    if (process.env.NODE_ENV === "development") {
      console.log("[PostHog] User identified:", userId, properties);
    }
  } catch (error) {
    console.error("[PostHog] Error identifying user:", error);
  }
}

/**
 * Reset user identification (on logout)
 */
export function resetUser(): void {
  if (!isPostHogReady()) return;

  try {
    posthog.reset();
    if (process.env.NODE_ENV === "development") {
      console.log("[PostHog] User reset");
    }
  } catch (error) {
    console.error("[PostHog] Error resetting user:", error);
  }
}

// Pre-defined event tracking functions for common events

/**
 * Track onboarding completion
 */
export function trackOnboardingCompleted(userId: string, properties?: {
  leadsCreated?: number;
  calendarConnected?: boolean;
  workingHoursSet?: boolean;
}) {
  identifyUser(userId);
  trackEvent("onboarding_completed", {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track Fast Win completion
 */
export function trackFastWinCompleted(properties?: {
  actionId?: string;
  actionType?: string;
  duration?: number; // seconds
}) {
  trackEvent("fast_win_completed", {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track action completion
 */
export function trackActionCompleted(properties?: {
  actionId?: string;
  actionType?: string;
  actionState?: string;
  duration?: number; // seconds
}) {
  trackEvent("action_completed", {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track "Got Reply" action
 */
export function trackGotReply(properties?: {
  actionId?: string;
  actionType?: string;
}) {
  trackEvent("got_reply", {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track lead/relationship creation
 */
export function trackLeadCreated(properties?: {
  leadId?: string;
  source?: string; // "onboarding" | "manual" | etc.
}) {
  trackEvent("lead_created", {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track daily plan generation
 */
export function trackDailyPlanGenerated(properties?: {
  planId?: string;
  actionCount?: number;
  fastWinIncluded?: boolean;
  capacityLevel?: string;
}) {
  trackEvent("daily_plan_generated", {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track paywall interactions
 */
export function trackPaywallViewed(properties?: {
  subscriptionStatus?: string;
  trialEndsAt?: string;
  isReadOnly?: boolean;
}) {
  trackEvent("paywall_viewed", {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

export function trackPaywallCTAClicked(properties?: {
  subscriptionStatus?: string;
  ctaType?: string; // "subscribe" | "upgrade" | "update_payment"
}) {
  trackEvent("paywall_cta_clicked", {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track subscription events
 */
export function trackSubscriptionStarted(properties?: {
  planType?: string; // "standard" | "premium"
  interval?: string; // "month" | "year"
  isTrial?: boolean;
}) {
  trackEvent("subscription_started", {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

export function trackSubscriptionUpgraded(properties?: {
  fromPlan?: string;
  toPlan?: string;
}) {
  trackEvent("subscription_upgraded", {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track content prompt interactions
 */
export function trackContentPromptSaved(properties?: {
  promptId?: string;
  promptType?: string;
}) {
  trackEvent("content_prompt_saved", {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

export function trackContentPromptCopied(properties?: {
  promptId?: string;
  promptType?: string;
}) {
  trackEvent("content_prompt_copied", {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track weekly summary viewed
 */
export function trackWeeklySummaryViewed(properties?: {
  summaryId?: string;
  weekStartDate?: string;
}) {
  trackEvent("weekly_summary_viewed", {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

