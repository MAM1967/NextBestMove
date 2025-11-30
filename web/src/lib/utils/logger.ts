/**
 * Centralized logging utility
 * Simple console logging - logs appear in Vercel dashboard
 * Use this for structured logging throughout the application
 */

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
}

/**
 * Log an error message
 */
export function logError(
  message: string,
  error?: Error | unknown,
  context?: LogContext
) {
  console.error(`[ERROR] ${message}`, error || "", context || "");
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

