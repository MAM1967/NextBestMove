# Stripe Idempotency Implementation

**Date:** December 26, 2025  
**Status:** ✅ Complete  
**Related:** NEX-16 - Adopt idempotency everywhere for Stripe billing flows

---

## Overview

This document describes the idempotency strategy implemented across all Stripe touchpoints to prevent duplicate charges and other side effects. All operations can be safely retried without creating duplicate charges, subscriptions, or other side effects.

---

## Idempotency Mechanisms

### 1. Database-Level Idempotency Keys

**Table:** `idempotency_keys`
- **Key:** Primary key (TEXT) - unique idempotency key
- **Result:** JSONB - cached result of the operation
- **Created At:** Timestamp for cleanup
- **Retention:** 24 hours (automatic cleanup)

**Usage:** Stores results of idempotent operations for 24 hours. If an operation with the same key is attempted within this window, the cached result is returned.

### 2. Stripe API Idempotency Keys

**Usage:** All Stripe API calls that create or modify resources include an `idempotencyKey` parameter. Stripe uses these keys to ensure operations are idempotent at their API level.

**Key Generation:** Deterministic keys generated from:
- User ID
- Operation type
- Operation parameters (sorted for consistency)

**Format:** `{operation}_{userId}_{hash}` (max 255 chars for Stripe)

### 3. Webhook Event Idempotency

**Table:** `billing_events`
- **stripe_event_id:** UNIQUE constraint ensures each event is processed once
- **processed_at:** Timestamp when event was processed

**Strategy:** Before processing any webhook event, check if `stripe_event_id` already exists. If it does, return success without reprocessing.

---

## Endpoint Idempotency Strategy

### ✅ POST `/api/billing/create-checkout-session`

**Strategy:**
1. Generate idempotency key from user ID, plan, interval, and URLs
2. Check `idempotency_keys` table for existing result
3. If exists, return cached checkout session URL
4. If not, create checkout session with Stripe idempotency key
5. Store result in `idempotency_keys` table
6. Return checkout session URL

**Stripe API:** Uses `idempotencyKey` parameter in `stripe.checkout.sessions.create()`

**Protection Level:** ✅ Full protection against duplicate checkout sessions

---

### ✅ POST `/api/billing/start-trial`

**Strategy:**
1. Generate idempotency key from user ID, customer ID, price ID, plan, interval
2. Check `idempotency_keys` table for existing result
3. If exists, return cached subscription
4. If not, create subscription with Stripe idempotency key
5. Store result in `idempotency_keys` table
6. Return subscription details

**Stripe API:** Uses `idempotencyKey` parameter in `stripe.subscriptions.create()`

**Protection Level:** ✅ Full protection against duplicate subscriptions

---

### ✅ POST `/api/billing/create-subscription-no-trial`

**Strategy:**
1. Generate idempotency key from user ID, customer ID, price ID, plan, interval, payment method ID
2. Check `idempotency_keys` table for existing result
3. If exists, return cached subscription
4. If not, create subscription with Stripe idempotency key
5. Store result in `idempotency_keys` table
6. Return subscription details

**Stripe API:** Uses `idempotencyKey` parameter in `stripe.subscriptions.create()`

**Protection Level:** ✅ Full protection against duplicate subscriptions

---

### ✅ POST `/api/billing/webhook`

**Strategy:**
1. Verify webhook signature (Stripe requirement)
2. Check if `stripe_event_id` exists in `billing_events` table
3. If exists:
   - Log warning about duplicate event
   - Return 200 (success) without reprocessing
4. If not exists:
   - Insert event into `billing_events` with `processed_at` timestamp
   - Process event (update subscriptions, customers, etc.)
   - Handle race conditions (if insert fails with UNIQUE violation, return success)

**Database Protection:** UNIQUE constraint on `stripe_event_id` in `billing_events` table

**Protection Level:** ✅ Full protection against duplicate event processing

**Event Types Handled:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

---

### ✅ POST `/api/billing/sync-subscription`

**Strategy:**
- Uses existing `handleSubscriptionUpdated()` function which uses database upsert with `stripe_subscription_id` as conflict target
- Database UNIQUE constraint on `stripe_subscription_id` prevents duplicates

**Protection Level:** ✅ Database-level protection via UNIQUE constraint

---

### ✅ POST `/api/billing/customer-portal`

**Strategy:**
- Creates portal session on-demand
- Portal sessions are stateless and can be safely created multiple times
- No idempotency needed (no side effects)

**Protection Level:** ✅ No protection needed (stateless operation)

---

## Customer Creation Idempotency

Customer creation uses database-level guards:
- Check if `billing_customers` record exists for user
- If exists, use existing `stripe_customer_id`
- If not, create new customer in Stripe and store in database

**Note:** Stripe customer creation doesn't use idempotency keys because:
1. We check database first (application-level guard)
2. Multiple customers per user would be caught by database UNIQUE constraint
3. Customer creation is infrequent and not in critical path

---

## Subscription Updates

Subscription updates use database upsert with `onConflict: "stripe_subscription_id"`:
- If subscription exists, update it
- If not, insert new record
- Database UNIQUE constraint on `stripe_subscription_id` ensures one record per subscription

**Protection Level:** ✅ Database-level protection via UNIQUE constraint

---

## Logging and Monitoring

### Duplicate Event Detection

All duplicate events are logged with:
- `logWarn()` - Makes duplicates visible in monitoring
- `logWebhookEvent()` - Structured logging with `status: "duplicate"`
- Context includes `eventId`, `eventType`, `originallyProcessedAt`

### Observability

Key metrics to monitor:
1. **Duplicate webhook events** - Look for `status: "duplicate"` in logs
2. **Idempotency key cache hits** - Look for "Returning cached result" messages
3. **Race condition detections** - Look for "race condition" in logs

### Alerting Recommendations

Set up alerts for:
- High volume of duplicate webhook events (may indicate webhook retry issues)
- Idempotency key storage failures (may indicate database issues)
- Webhook processing failures after duplicate detection (may indicate bugs)

---

## Testing Strategy

### Manual Testing

1. **Checkout Session Duplication:**
   - Send identical POST requests to `/api/billing/create-checkout-session`
   - Verify only one checkout session is created
   - Verify subsequent requests return cached session URL

2. **Subscription Duplication:**
   - Send identical POST requests to `/api/billing/start-trial`
   - Verify only one subscription is created in Stripe
   - Verify subsequent requests return cached subscription

3. **Webhook Retry:**
   - Send the same webhook event multiple times
   - Verify event is processed only once
   - Verify duplicate events return 200 without side effects

### Automated Testing (Recommended)

Create integration tests that:
1. Call endpoints twice with identical parameters
2. Verify Stripe API was called only once
3. Verify database records are not duplicated
4. Verify cached results are returned on subsequent calls

---

## Edge Cases Handled

### Race Conditions

**Scenario:** Two webhook events arrive simultaneously for the same `stripe_event_id`

**Handling:**
1. First request inserts event into `billing_events`
2. Second request detects existing event and returns success
3. If both try to insert simultaneously, database UNIQUE constraint ensures only one succeeds
4. The failing insert is detected by error code `23505` and returns success

### Concurrent API Calls

**Scenario:** User clicks "Start Trial" button twice quickly

**Handling:**
1. Both requests generate same idempotency key (deterministic)
2. First request processes and stores result
3. Second request finds cached result and returns immediately
4. Stripe API also uses idempotency key to prevent duplicates

### Network Failures

**Scenario:** Request succeeds but client doesn't receive response

**Handling:**
1. Client can safely retry the request
2. Idempotency key ensures same operation is not executed twice
3. Cached result is returned if operation already completed

---

## Implementation Files

- **Idempotency Utility:** `web/src/lib/billing/idempotency.ts`
- **Database Migration:** `supabase/migrations/202512260002_create_idempotency_keys_table.sql`
- **Webhook Handler:** `web/src/app/api/billing/webhook/route.ts`
- **Checkout Session:** `web/src/app/api/billing/create-checkout-session/route.ts`
- **Start Trial:** `web/src/app/api/billing/start-trial/route.ts`
- **Create Subscription:** `web/src/app/api/billing/create-subscription-no-trial/route.ts`

---

## Summary

All Stripe touchpoints now have idempotency protection:

✅ **Checkout Session Creation** - Database + Stripe idempotency keys  
✅ **Subscription Creation** - Database + Stripe idempotency keys  
✅ **Webhook Processing** - Database UNIQUE constraint + duplicate detection  
✅ **Subscription Updates** - Database upsert with UNIQUE constraint  
✅ **Customer Creation** - Database-level guards  

All duplicate events are logged with warnings for monitoring. The system is protected against:
- Duplicate charges
- Duplicate subscriptions
- Duplicate webhook processing
- Race conditions
- Network retries






