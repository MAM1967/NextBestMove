# Webhook Failure Recovery Procedures

**Last Updated:** January 3, 2026  
**Status:** ✅ Documented

This document describes procedures for identifying, monitoring, and recovering from failed Stripe webhook events in NextBestMove.

---

## Table of Contents

1. [Webhook Overview](#webhook-overview)
2. [Identifying Failed Webhooks](#identifying-failed-webhooks)
3. [Manual Webhook Retry](#manual-webhook-retry)
4. [Webhook Status Monitoring](#webhook-status-monitoring)
5. [Verification Procedures](#verification-procedures)
6. [Troubleshooting](#troubleshooting)

---

## Webhook Overview

### Current Implementation

**Webhook Endpoint:** `/api/billing/webhook`  
**Webhook Secret:** `STRIPE_WEBHOOK_SECRET` (from environment variables)  
**Idempotency:** ✅ Implemented via `billing_events` table  
**Signature Verification:** ✅ Implemented via `stripe.webhooks.constructEvent`

### Supported Event Types

- `checkout.session.completed` - New subscription created
- `customer.subscription.created` - Subscription created
- `customer.subscription.updated` - Subscription status changed
- `customer.subscription.deleted` - Subscription canceled
- `invoice.paid` - Payment succeeded
- `invoice.payment_failed` - Payment failed

### Idempotency Protection

All webhooks are idempotent:
- Events are stored in `billing_events` table with `stripe_event_id`
- Duplicate events are detected and skipped
- Race conditions are handled (concurrent processing)

---

## Identifying Failed Webhooks

### Method 1: Stripe Dashboard

**Steps:**

1. **Navigate to Stripe Dashboard:**
   - Go to https://dashboard.stripe.com
   - Select your account (Test or Live mode)
   - Go to **Developers** → **Webhooks**

2. **Check Webhook Status:**
   - Find your webhook endpoint: `https://nextbestmove.app/api/billing/webhook`
   - Click on the webhook to view details
   - Check **Recent events** tab

3. **Identify Failed Events:**
   - Look for events with **Failed** status (red indicator)
   - Check **Attempts** column - shows retry count
   - Click on failed event to see error details

4. **Review Error Details:**
   - Check **Response** tab for error message
   - Check **Request** tab for event payload
   - Note the `event_id` for manual retry

**Common Failure Reasons:**
- `500 Internal Server Error` - Application error
- `400 Bad Request` - Signature verification failed
- `Timeout` - Request took too long (>30s)
- `Connection Error` - Network issue

---

### Method 2: Database Query

**Check Recent Webhook Processing:**

```sql
-- Check recent webhook events in database
SELECT 
  stripe_event_id,
  type,
  processed_at,
  created_at,
  CASE 
    WHEN processed_at IS NOT NULL THEN 'Processed'
    ELSE 'Pending'
  END as status
FROM billing_events
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 50;
```

**Check for Missing Events:**

```sql
-- Compare Stripe events with database events
-- (This requires Stripe API access - see troubleshooting section)
-- For now, check for events that should have been processed but weren't

-- Find events that took > 5 minutes to process (potential issues)
SELECT 
  stripe_event_id,
  type,
  created_at,
  processed_at,
  EXTRACT(EPOCH FROM (processed_at - created_at)) as processing_time_seconds
FROM billing_events
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND processed_at IS NOT NULL
  AND EXTRACT(EPOCH FROM (processed_at - created_at)) > 300
ORDER BY processing_time_seconds DESC;
```

**Check for Duplicate Processing:**

```sql
-- Check for duplicate events (should not happen due to idempotency)
SELECT 
  stripe_event_id,
  COUNT(*) as count,
  array_agg(id) as event_ids,
  array_agg(created_at) as timestamps
FROM billing_events
GROUP BY stripe_event_id
HAVING COUNT(*) > 1;
```

---

### Method 3: Application Logs

**Check Vercel Function Logs:**

1. Go to Vercel Dashboard → **NextBestMove** project
2. Navigate to **Functions** → `/api/billing/webhook`
3. Check recent invocations for errors
4. Look for:
   - `[ERROR]` log entries
   - `[WEBHOOK ERROR]` log entries
   - 500 status codes

**Check GlitchTip:**

1. Go to GlitchTip dashboard
2. Filter by:
   - Error type: "webhook"
   - Endpoint: "/api/billing/webhook"
3. Review error details and stack traces

---

## Manual Webhook Retry

### Method 1: Stripe Dashboard (Recommended)

**Steps:**

1. **Navigate to Failed Event:**
   - Go to Stripe Dashboard → **Developers** → **Webhooks**
   - Click on your webhook endpoint
   - Find the failed event in **Recent events**
   - Click on the failed event

2. **Review Event Details:**
   - Check **Response** tab for error message
   - Verify event payload in **Request** tab
   - Note the `event_id` (e.g., `evt_1234567890`)

3. **Retry Event:**
   - Click **Send test webhook** or **Replay event** button
   - Confirm retry
   - Monitor the retry attempt

4. **Verify Retry Success:**
   - Check event status changes to **Succeeded**
   - Verify in database (see verification procedures below)
   - Check application logs for processing confirmation

**Note:** Stripe automatically retries failed webhooks up to 3 times over 72 hours. Manual retry is only needed if:
- Automatic retries exhausted
- Immediate processing required
- Testing specific event

---

### Method 2: Stripe CLI (For Testing)

**Prerequisites:**
- Stripe CLI installed: `stripe --version`
- Authenticated: `stripe login`
- Webhook forwarding running: `stripe listen --forward-to localhost:3000/api/billing/webhook`

**Steps:**

1. **Trigger Test Event:**
   ```bash
   stripe trigger checkout.session.completed
   ```

2. **Or Replay Specific Event:**
   ```bash
   stripe events resend evt_1234567890
   ```

3. **Monitor Logs:**
   - Check Stripe CLI output for webhook delivery
   - Check application logs for processing

---

### Method 3: Manual API Call (Advanced)

**⚠️ WARNING: Only use if Stripe dashboard retry unavailable**

**Steps:**

1. **Get Event from Stripe API:**
   ```bash
   curl https://api.stripe.com/v1/events/evt_1234567890 \
     -u sk_live_...: \
     -H "Stripe-Version: 2023-10-16"
   ```

2. **Reconstruct Webhook Request:**
   - Extract event payload from API response
   - Sign payload with webhook secret (see Stripe docs)
   - Send POST request to webhook endpoint

**Note:** This is complex and error-prone. Prefer Stripe dashboard retry.

---

## Webhook Status Monitoring

### Current Monitoring

**Status:** ⚠️ Basic logging implemented, alerts not yet configured

**Current Implementation:**
- Webhook events logged via `logWebhookEvent()`
- Errors logged via `logError()`
- Events stored in `billing_events` table

### Recommended Monitoring Setup

#### 1. Database Monitoring Query

**Create a monitoring query to check webhook health:**

```sql
-- Webhook Health Check Query
-- Run this daily to monitor webhook processing

WITH recent_events AS (
  SELECT 
    stripe_event_id,
    type,
    created_at,
    processed_at,
    CASE 
      WHEN processed_at IS NOT NULL THEN true
      ELSE false
    END as is_processed,
    EXTRACT(EPOCH FROM (COALESCE(processed_at, NOW()) - created_at)) as processing_time_seconds
  FROM billing_events
  WHERE created_at > NOW() - INTERVAL '24 hours'
)
SELECT 
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE is_processed) as processed_events,
  COUNT(*) FILTER (WHERE NOT is_processed) as pending_events,
  AVG(processing_time_seconds) FILTER (WHERE is_processed) as avg_processing_time_seconds,
  MAX(processing_time_seconds) FILTER (WHERE is_processed) as max_processing_time_seconds,
  COUNT(*) FILTER (WHERE processing_time_seconds > 10) as slow_events
FROM recent_events;
```

**Expected Results:**
- `total_events` > 0 (webhooks are being received)
- `processed_events` = `total_events` (all events processed)
- `avg_processing_time_seconds` < 5 (fast processing)
- `max_processing_time_seconds` < 30 (no timeouts)
- `slow_events` = 0 (no slow processing)

#### 2. GlitchTip Alerts

**Recommended Alerts:**

1. **Webhook Processing Errors:**
   - Condition: Error rate > 5% for `/api/billing/webhook`
   - Action: Email/Slack notification
   - Threshold: 3 errors in 5 minutes

2. **Webhook Timeout:**
   - Condition: Function duration > 25 seconds
   - Action: Immediate alert
   - Threshold: 1 occurrence

3. **Webhook Signature Failures:**
   - Condition: 400 status code from webhook endpoint
   - Action: Immediate alert (security concern)
   - Threshold: 1 occurrence

**Setup Steps:**
1. Go to GlitchTip Dashboard
2. Navigate to **Alerts** → **Create Alert**
3. Configure conditions above
4. Set notification channels (email, Slack, etc.)

#### 3. Custom Health Check Endpoint (Future)

**Create `/api/health/webhooks` endpoint:**

```typescript
// Check webhook processing health
// Returns: { healthy: boolean, stats: {...} }
```

**Monitor:**
- Recent webhook processing rate
- Average processing time
- Failed webhook count
- Pending webhook count

---

## Verification Procedures

### After Manual Retry

**Verify webhook processed correctly:**

1. **Check Database:**
   ```sql
   -- Verify event was processed
   SELECT 
     stripe_event_id,
     type,
     processed_at,
     created_at
   FROM billing_events
   WHERE stripe_event_id = 'evt_1234567890';
   ```
   - Should show `processed_at` timestamp
   - Should match event type from Stripe

2. **Check Subscription Status:**
   ```sql
   -- For subscription events, verify subscription updated
   SELECT 
     bs.stripe_subscription_id,
     bs.status,
     bs.updated_at,
     bc.stripe_customer_id
   FROM billing_subscriptions bs
   INNER JOIN billing_customers bc ON bs.billing_customer_id = bc.id
   WHERE bs.stripe_subscription_id = 'sub_1234567890';
   ```
   - Status should match Stripe subscription status
   - `updated_at` should be recent

3. **Check User Tier:**
   ```sql
   -- Verify user tier updated correctly
   SELECT 
     u.id,
     u.email,
     u.tier,
     bs.status as subscription_status
   FROM users u
   LEFT JOIN billing_customers bc ON bc.user_id = u.id
   LEFT JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
   WHERE u.email = 'user@example.com';
   ```
   - Tier should match subscription status
   - Free tier if no active subscription
   - Standard/Premium if active subscription

4. **Check Application Logs:**
   - Look for `[WEBHOOK] Webhook processed successfully` log
   - Verify no errors in processing
   - Check processing time (should be < 5 seconds)

---

### Verification Checklist

**After retrying a webhook:**

- [ ] Event appears in `billing_events` table
- [ ] `processed_at` timestamp is set
- [ ] Subscription status matches Stripe (if subscription event)
- [ ] User tier updated correctly (if subscription event)
- [ ] No duplicate processing (idempotency check)
- [ ] Application logs show successful processing
- [ ] No errors in GlitchTip

---

## Troubleshooting

### Webhook Not Received

**Possible causes:**
1. Webhook endpoint URL incorrect
2. Webhook secret mismatch
3. Network/firewall blocking requests
4. Application not deployed

**Actions:**
- Verify webhook URL in Stripe dashboard
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe
- Test webhook endpoint manually
- Check Vercel deployment status

### Signature Verification Fails

**Possible causes:**
1. Webhook secret incorrect
2. Request body modified (middleware, proxy)
3. Encoding issues

**Actions:**
- Verify `STRIPE_WEBHOOK_SECRET` in environment variables
- Check for middleware modifying request body
- Ensure raw body is used for signature verification

### Event Processing Fails

**Possible causes:**
1. Database connection error
2. Missing data (customer, subscription not found)
3. Application error in handler
4. Timeout (>30 seconds)

**Actions:**
- Check database connectivity
- Verify customer/subscription exists in database
- Review application logs for errors
- Check function execution time in Vercel

### Duplicate Processing

**Possible causes:**
1. Idempotency check failed
2. Race condition (concurrent requests)
3. Database constraint not working

**Actions:**
- Check `billing_events` table for duplicates
- Verify unique constraint on `stripe_event_id`
- Review idempotency logic in webhook handler

---

## Quick Reference

### Useful Queries

```sql
-- Check recent webhook processing
SELECT stripe_event_id, type, processed_at, created_at
FROM billing_events
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Find unprocessed events
SELECT stripe_event_id, type, created_at
FROM billing_events
WHERE processed_at IS NULL
ORDER BY created_at DESC;

-- Check webhook processing time
SELECT 
  type,
  AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_seconds,
  MAX(EXTRACT(EPOCH FROM (processed_at - created_at))) as max_seconds
FROM billing_events
WHERE processed_at IS NOT NULL
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY type;
```

### Useful Links

- **Stripe Dashboard:** https://dashboard.stripe.com
- **Stripe Webhooks Docs:** https://stripe.com/docs/webhooks
- **Stripe CLI:** https://stripe.com/docs/stripe-cli
- **Vercel Functions:** https://vercel.com/dashboard
- **GlitchTip:** [Your GlitchTip URL]

---

## Next Steps

1. **Immediate:**
   - [ ] Set up GlitchTip alerts for webhook errors
   - [ ] Create monitoring dashboard query
   - [ ] Test manual retry procedure on staging

2. **Short-term:**
   - [ ] Implement webhook health check endpoint
   - [ ] Add webhook processing time monitoring
   - [ ] Document common failure scenarios

3. **Long-term:**
   - [ ] Set up automated webhook retry (if needed)
   - [ ] Implement webhook status dashboard
   - [ ] Add webhook replay testing

---

**Document Status:** ✅ Complete  
**Next Review:** After first webhook failure incident

