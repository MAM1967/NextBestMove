/**
 * Stripe-related TypeScript types
 * 
 * Re-exports and extends Stripe types for better type safety.
 */

import type Stripe from "stripe";

/**
 * Re-export commonly used Stripe types
 */
export type {
  Stripe,
  StripeEvent,
  StripeCustomer,
  StripeSubscription,
  StripeCheckoutSession,
  StripePrice,
  StripeProduct,
  StripeInvoice,
  StripePaymentIntent,
  StripePaymentMethod,
} from "stripe";

/**
 * Type guard to check if an error is a Stripe error
 */
export function isStripeError(error: unknown): error is Stripe.errors.StripeError {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    "message" in error &&
    typeof (error as { type: unknown }).type === "string" &&
    (error as { type: string }).type.startsWith("Stripe")
  );
}

/**
 * Extract error message from Stripe error or unknown error
 */
export function getStripeErrorMessage(error: unknown): string {
  if (isStripeError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Type guard for checkout.session.completed event
 */
export function isCheckoutSessionCompleted(
  event: Stripe.Event
): event is Stripe.Event & {
  type: "checkout.session.completed";
  data: { object: Stripe.Checkout.Session };
} {
  return event.type === "checkout.session.completed";
}

/**
 * Type guard for customer.subscription.created event
 */
export function isSubscriptionCreated(
  event: Stripe.Event
): event is Stripe.Event & {
  type: "customer.subscription.created";
  data: { object: Stripe.Subscription };
} {
  return event.type === "customer.subscription.created";
}

/**
 * Type guard for customer.subscription.updated event
 */
export function isSubscriptionUpdated(
  event: Stripe.Event
): event is Stripe.Event & {
  type: "customer.subscription.updated";
  data: { object: Stripe.Subscription };
} {
  return event.type === "customer.subscription.updated";
}

/**
 * Type guard for customer.subscription.deleted event
 */
export function isSubscriptionDeleted(
  event: Stripe.Event
): event is Stripe.Event & {
  type: "customer.subscription.deleted";
  data: { object: Stripe.Subscription };
} {
  return event.type === "customer.subscription.deleted";
}

/**
 * Type guard for invoice.payment_failed event
 */
export function isInvoicePaymentFailed(
  event: Stripe.Event
): event is Stripe.Event & {
  type: "invoice.payment_failed";
  data: { object: Stripe.Invoice };
} {
  return event.type === "invoice.payment_failed";
}

/**
 * Type guard for invoice.payment_succeeded event
 */
export function isInvoicePaymentSucceeded(
  event: Stripe.Event
): event is Stripe.Event & {
  type: "invoice.payment_succeeded";
  data: { object: Stripe.Invoice };
} {
  return event.type === "invoice.payment_succeeded";
}

