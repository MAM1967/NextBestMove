/**
 * Centralized logging utility
 * Logs to console (Vercel dashboard) and GlitchTip (error tracking)
 * Use this for structured logging throughout the application
 */

import * as Sentry from "@sentry/nextjs";

interface LogContext {
  [key: string]: unknown;
}

/**
 * Log an info message
 */
export function logInfo(message: string, context?: LogContext) {
  console.log(`[INFO] ${message}`, context || "");
}

/**
 * Log a warning message
 */
export function logWarn(message: string, context?: LogContext) {
  console.warn(`[WARN] ${message}`, context || "");
  
  // Send warnings to GlitchTip as breadcrumbs
  try {
    Sentry.addBreadcrumb({
      message,
      level: "warning",
      data: context,
    });
  } catch {
    // Ignore errors - logging shouldn't break the app
  }
}

/**
 * Log an error message
 * Automatically sends to GlitchTip if configured
 */
export function logError(
  message: string,
  error?: Error | unknown,
  context?: LogContext
) {
  console.error(`[ERROR] ${message}`, error || "", context || "");

  // Send errors to GlitchTip
  try {
    if (error instanceof Error) {
      Sentry.captureException(error, {
        tags: {
          error_type: "application_error",
        },
        extra: {
          message,
          ...context,
        },
      });
    } else if (error) {
      // Non-Error objects
      Sentry.captureMessage(message, {
        level: "error",
        extra: {
          error: String(error),
          ...context,
        },
      });
    } else {
      // Just a message
      Sentry.captureMessage(message, {
        level: "error",
        extra: context,
      });
    }
  } catch {
    // Ignore errors - logging shouldn't break the app
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
  
  // Log webhook errors with extra detail
  if (context.status === "error" || context.status === "failed") {
    console.error(`[WEBHOOK ERROR] ${event}`, context);
  }
}

/**
 * Set user context (no-op, kept for API compatibility)
 */
export function setUserContext(userId: string, email?: string) {
  // No-op - kept for API compatibility
  // Can add user context logging here if needed
}

/**
 * Clear user context (no-op, kept for API compatibility)
 */
export function clearUserContext() {
  // No-op - kept for API compatibility
}

