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
  
  // Don't send warnings as breadcrumbs to reduce event volume
  // Breadcrumbs count toward GlitchTip event limits
  // Only log to console for now
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
 * Automatically sends errors to GlitchTip with webhook-specific tags
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
  
  // Log webhook errors with extra detail and send to GlitchTip
  if (context.status === "error" || context.status === "failed") {
    console.error(`[WEBHOOK ERROR] ${event}`, context);
    
    // Send webhook errors to GlitchTip with specific tags for alerting
    try {
      Sentry.captureMessage(`Webhook Error: ${event}`, {
        level: "error",
        tags: {
          error_type: "webhook_error",
          webhook_type: context.webhookType || "unknown",
          component: "webhook",
        },
        extra: {
          ...context,
        },
      });
    } catch {
      // Ignore errors - logging shouldn't break the app
    }
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

/**
 * Log cron job events with structured context
 * Automatically sends errors to GlitchTip with cron-specific tags
 */
export function logCronEvent(
  event: string,
  context: LogContext & {
    cronJobName?: string;
    jobId?: string;
    status?: "success" | "error" | "failed";
    duration?: number;
    error?: Error | unknown;
  }
) {
  const logMessage = `[CRON] ${event}`;
  console.log(logMessage, context);
  
  // Log cron job errors with extra detail and send to GlitchTip
  if (context.status === "error" || context.status === "failed") {
    console.error(`[CRON ERROR] ${event}`, context);
    
    // Send cron job errors to GlitchTip with specific tags for alerting
    try {
      if (context.error instanceof Error) {
        Sentry.captureException(context.error, {
          tags: {
            error_type: "cron_job_error",
            cron_job_name: context.cronJobName || "unknown",
            component: "cron",
          },
          extra: {
            message: event,
            ...context,
          },
        });
      } else {
        Sentry.captureMessage(`Cron Job Error: ${event}`, {
          level: "error",
          tags: {
            error_type: "cron_job_error",
            cron_job_name: context.cronJobName || "unknown",
            component: "cron",
          },
          extra: {
            ...context,
          },
        });
      }
    } catch {
      // Ignore errors - logging shouldn't break the app
    }
  }
}

/**
 * Log database connection errors
 * Automatically sends to GlitchTip with database-specific tags
 */
export function logDatabaseError(
  message: string,
  error: Error | unknown,
  context?: LogContext
) {
  logError(message, error, context);
  
  // Add database-specific tags
  try {
    if (error instanceof Error) {
      Sentry.captureException(error, {
        tags: {
          error_type: "database_error",
          component: "database",
        },
        extra: {
          message,
          ...context,
        },
      });
    }
  } catch {
    // Ignore errors - logging shouldn't break the app
  }
}

/**
 * Log query execution time
 * Automatically logs slow queries (>500ms) as warnings
 */
export function logQueryTime(
  queryName: string,
  duration: number,
  context?: LogContext
) {
  const threshold = 500; // ms

  if (duration > threshold) {
    logWarn(`Slow query detected: ${queryName}`, {
      duration: `${duration}ms`,
      threshold: `${threshold}ms`,
      ...context,
    });
  } else if (process.env.LOG_ALL_QUERIES === "true") {
    logInfo(`Query: ${queryName}`, {
      duration: `${duration}ms`,
      ...context,
    });
  }
}

/**
 * Wrap a database query with timing
 */
export async function withQueryTiming<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const start = Date.now();
  try {
    const result = await queryFn();
    const duration = Date.now() - start;
    logQueryTime(queryName, duration, context);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logError(`Query failed: ${queryName}`, error, {
      duration: `${duration}ms`,
      ...context,
    });
    throw error;
  }
}

