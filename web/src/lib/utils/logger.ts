/**
 * Centralized logging utility with Sentry integration
 * Use this for structured logging throughout the application
 */

import * as Sentry from "@sentry/nextjs";

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  [key: string]: unknown;
}

/**
 * Log an info message
 */
export function logInfo(message: string, context?: LogContext) {
  console.log(`[INFO] ${message}`, context || "");
  if (context) {
    Sentry.addBreadcrumb({
      message,
      level: "info",
      data: context,
    });
  }
}

/**
 * Log a warning message
 */
export function logWarn(message: string, context?: LogContext) {
  console.warn(`[WARN] ${message}`, context || "");
  if (context) {
    Sentry.addBreadcrumb({
      message,
      level: "warning",
      data: context,
    });
  }
}

/**
 * Log an error message and capture in Sentry
 */
export function logError(
  message: string,
  error?: Error | unknown,
  context?: LogContext
) {
  console.error(`[ERROR] ${message}`, error || "", context || "");

  if (error instanceof Error) {
    Sentry.captureException(error, {
      tags: context ? (Object.fromEntries(
        Object.entries(context).filter(([_, v]) => 
          typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
        )
      ) as Record<string, string | number | boolean>) : undefined,
      extra: context,
    });
  } else {
    Sentry.captureMessage(message, {
      level: "error",
      tags: context ? (Object.fromEntries(
        Object.entries(context).filter(([_, v]) => 
          typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
        )
      ) as Record<string, string | number | boolean>) : undefined,
      extra: { ...context, error },
    });
  }
}

/**
 * Log billing-related events with structured context
 */
export function logBillingEvent(
  event: string,
  context: LogContext & {
    userId?: string;
    customerId?: string;
    subscriptionId?: string;
    amount?: number;
    currency?: string;
  }
) {
  const logMessage = `[BILLING] ${event}`;
  console.log(logMessage, context);

  Sentry.addBreadcrumb({
    message: logMessage,
    level: "info",
    category: "billing",
    data: context,
  });

  // Also send as event for analytics (if PostHog is added later)
  // This structure makes it easy to add analytics tracking
}

/**
 * Log webhook events with structured context
 */
export function logWebhookEvent(
  event: string,
  context: LogContext & {
    webhookType?: string;
    eventId?: string;
    userId?: string;
    status?: string;
  }
) {
  const logMessage = `[WEBHOOK] ${event}`;
  console.log(logMessage, context);

  Sentry.addBreadcrumb({
    message: logMessage,
    level: "info",
    category: "webhook",
    data: context,
  });

  // Capture webhook errors specifically
  if (context.status === "error" || context.status === "failed") {
    const tags: Record<string, string | number | boolean> = {};
    if (context.webhookType) tags.webhookType = String(context.webhookType);
    if (context.eventId) tags.eventId = String(context.eventId);
    
    Sentry.captureMessage(`Webhook ${event} failed`, {
      level: "error",
      tags: Object.keys(tags).length > 0 ? tags : undefined,
      extra: context,
    });
  }
}

/**
 * Set user context for Sentry (call after user logs in)
 */
export function setUserContext(userId: string, email?: string) {
  Sentry.setUser({
    id: userId,
    email: email,
  });
}

/**
 * Clear user context (call on logout)
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

