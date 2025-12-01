# Group 2 Complete Testing Guide - Payment & Churn Recovery

**Date:** January 2025  
**Status:** 📋 Ready for Testing  
**Features:**

1. Payment Failure Recovery Flow (Day 0, 3, 7, 14)
2. Past-Due & Cancellation Banners (dashboard alerts)
3. Win-Back Campaign Automation (Day 7, 30, 90, 180)

---

## Prerequisites

1. **Test User Account** - You'll need at least one test user account
2. **Supabase Access** - To run SQL scripts for test data setup
3. **Email Access** - To verify payment failure and win-back emails
4. **Browser Console** - Open DevTools to check for errors
5. **CRON_SECRET** or **CRON_JOB_ORG_API_KEY** - For testing cron endpoints
6. **Stripe Test Mode** - To simulate payment failures

---

## Step 1: Set Up Test User

First, identify your test user ID and email. You can find it in Supabase:

```sql
-- Find your test user
SELECT id, email, name
FROM users
WHERE email = 'your-test-email@example.com';
```

**Note:** Replace `'your-test-email@example.com'` with your actual test user email.

---

## Scenario 1: Payment Failure Recovery Flow

### Test 1.1: Day 0 - Immediate Payment Failure Email

**Setup SQL:**

```sql
-- Set user to payment failure (Day 0)
-- First, ensure user has an active subscription
UPDATE billing_subscriptions
SET status = 'past_due',
    payment_failed_at = NOW(),
    current_period_end = NOW() + INTERVAL '30 days'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers
  WHERE user_id = '<your_test_user_id>'
);
```

**Test Steps:**

1. **Simulate payment failure via Stripe webhook** (or manually set `payment_failed_at`)
2. **Check email inbox:**
   ✅ **Expected:** Email with subject "Payment failed — Update to keep your rhythm going"
   ✅ **Expected:** Email body includes urgent message about payment failure
   ✅ **Expected:** CTA button: "Update Payment Method"
   ✅ **Expected:** Link points to billing portal

**Verification Checklist:**

- [ ] Email sent immediately on payment failure
- [ ] Subject: "Payment failed — Update to keep your rhythm going"
- [ ] Body includes urgent message
- [ ] CTA button: "Update Payment Method"
- [ ] Link opens billing portal

---

### Test 1.2: Day 3 - Modal Display + Email

**Setup SQL:**

```sql
-- Set user to Day 3 after payment failure
UPDATE billing_subscriptions
SET status = 'past_due',
    payment_failed_at = NOW() - INTERVAL '3 days',
    current_period_end = NOW() + INTERVAL '27 days'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers
  WHERE user_id = '<your_test_user_id>'
);
```

**Test Steps:**

1. **Trigger the cron job manually:**

   ```bash
   # Using API key (production)
   curl -H "Authorization: Bearer tA4auCiGFs4DIVKM01ho5xJhKHyzR2XLgB8SEzaitOk=" \
     "https://nextbestmove.app/api/cron/payment-failure-recovery"

   # Or using query param
   curl "https://nextbestmove.app/api/cron/payment-failure-recovery?secret=99ad993f6bcf96c3523502f028184b248b30d125a0f2964c012afa338334b0da"
   ```

2. **Check the response:**
   ✅ **Expected:** Response shows `day3Emails: 1` (or more if other users match)

3. **Check email inbox:**
   ✅ **Expected:** Email with subject "Payment failed — Update to keep your rhythm going"
   ✅ **Expected:** Email mentions Day 3 urgency

4. **Log in as test user**
5. **Navigate to `/app` (dashboard)**
6. ✅ **Expected:** PaymentFailureModal appears with:
   - Headline: "Payment failed"
   - Description: "Update your payment method to keep your rhythm going"
   - CTA: "Update Payment Method"
   - Dismissible (X button)

**Verification Checklist:**

- [ ] Email sent on Day 3
- [ ] Modal appears on dashboard
- [ ] Modal shows correct messaging
- [ ] Modal can be dismissed
- [ ] Modal doesn't reappear after dismissal (localStorage check)
- [ ] Cron response shows `day3Emails: 1`

---

### Test 1.3: Day 7 - Read-Only Mode

**Setup SQL:**

```sql
-- Set user to Day 7 after payment failure
UPDATE billing_subscriptions
SET status = 'past_due',
    payment_failed_at = NOW() - INTERVAL '7 days',
    current_period_end = NOW() + INTERVAL '23 days'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers
  WHERE user_id = '<your_test_user_id>'
);
```

**Test Steps:**

1. **Trigger the cron job manually** (same command as Test 1.2)
2. **Check the response:**
   ✅ **Expected:** Response shows `day7ReadOnly: 1`
3. **Check email inbox:**
   ✅ **Expected:** Email sent on Day 7
4. **Log in as test user**
5. **Navigate to `/app/plan`**
6. ✅ **Expected:** PaywallOverlay appears (read-only mode)
7. ✅ **Expected:** Plan generation is blocked
8. ✅ **Expected:** User can still view existing data

**Verification Checklist:**

- [ ] Email sent on Day 7
- [ ] Read-only mode activated (plan generation blocked)
- [ ] PaywallOverlay appears
- [ ] User can view existing data
- [ ] Cron response shows `day7ReadOnly: 1`
- [ ] Metadata updated: `payment_failure_read_only_mode: true`

---

### Test 1.4: Day 14 - Account Archived

**Setup SQL:**

```sql
-- Set user to Day 14 after payment failure
UPDATE billing_subscriptions
SET status = 'past_due',
    payment_failed_at = NOW() - INTERVAL '14 days',
    current_period_end = NOW() + INTERVAL '16 days'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers
  WHERE user_id = '<your_test_user_id>'
);
```

**Test Steps:**

1. **Trigger the cron job manually** (same command as Test 1.2)
2. **Check the response:**
   ✅ **Expected:** Response shows `day14Archived: 1`
3. **Check email inbox:**
   ✅ **Expected:** Email sent on Day 14
4. **Check database:**
   ```sql
   SELECT status, metadata
   FROM billing_subscriptions
   WHERE billing_customer_id = (
     SELECT id FROM billing_customers
     WHERE user_id = '<your_test_user_id>'
   );
   ```
   ✅ **Expected:** Status changed to `canceled`
   ✅ **Expected:** Metadata includes `archived_at` and `archived_reason: "payment_failure_14_days"`

**Verification Checklist:**

- [ ] Email sent on Day 14
- [ ] Subscription status changed to `canceled`
- [ ] Metadata includes `archived_at`
- [ ] Metadata includes `archived_reason: "payment_failure_14_days"`
- [ ] Cron response shows `day14Archived: 1`

---

## Scenario 2: Past-Due & Cancellation Banners

### Test 2.1: Past-Due Banner

**Setup SQL:**

```sql
-- Set user to past_due status
UPDATE billing_subscriptions
SET status = 'past_due',
    current_period_end = NOW() + INTERVAL '30 days'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers
  WHERE user_id = '<your_test_user_id>'
);
```

**Test Steps:**

1. Log in as test user
2. Navigate to `/app` (dashboard)
3. ✅ **Expected:** Amber banner appears at top with:
   - Headline: "Payment failed"
   - Description: "Update your payment method to keep your rhythm going. Your access will continue until we retry payment."
   - CTA: "Update Payment Method" (amber button)
   - Dismissible (X button)
4. Click "Update Payment Method"
5. ✅ **Expected:** Billing portal opens
6. Dismiss banner
7. ✅ **Expected:** Banner doesn't reappear (dismissed state)

**Verification Checklist:**

- [ ] Banner appears for past-due subscriptions
- [ ] Banner shows correct messaging
- [ ] Banner includes billing portal CTA
- [ ] Banner is dismissible
- [ ] Banner doesn't reappear after dismissal
- [ ] Billing portal opens correctly

---

### Test 2.2: Cancellation Banner (cancel_at_period_end)

**Setup SQL:**

```sql
-- Set user to cancel_at_period_end (active but canceling)
UPDATE billing_subscriptions
SET status = 'active',
    cancel_at_period_end = true,
    current_period_end = NOW() + INTERVAL '15 days'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers
  WHERE user_id = '<your_test_user_id>'
);
```

**Test Steps:**

1. Log in as test user
2. Navigate to `/app` (dashboard)
3. ✅ **Expected:** Blue banner appears at top with:
   - Headline: "Subscription ending"
   - Description: "Your subscription is set to cancel on [date]. Reactivate anytime to keep your rhythm going."
   - CTA: "Reactivate Subscription" (blue button)
   - Dismissible (X button)
4. Click "Reactivate Subscription"
5. ✅ **Expected:** Billing portal opens

**Verification Checklist:**

- [ ] Banner appears for pending cancellations
- [ ] Banner shows correct cancellation date
- [ ] Banner includes reactivation CTA
- [ ] Banner is dismissible
- [ ] Billing portal opens correctly

---

### Test 2.3: No Banner for Active Subscriptions

**Setup SQL:**

```sql
-- Set user to active subscription
UPDATE billing_subscriptions
SET status = 'active',
    cancel_at_period_end = false,
    current_period_end = NOW() + INTERVAL '30 days'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers
  WHERE user_id = '<your_test_user_id>'
);
```

**Test Steps:**

1. Log in as test user
2. Navigate to `/app` (dashboard)
3. ✅ **Expected:** No billing alert banner appears

**Verification Checklist:**

- [ ] No banner for active subscriptions
- [ ] Dashboard displays normally

---

## Scenario 3: Win-Back Campaign Automation

### Test 3.1: Day 7 Win-Back Email

**Setup SQL:**

```sql
-- Set user to canceled (voluntary cancellation, not payment failure)
UPDATE billing_subscriptions
SET status = 'canceled',
    payment_failed_at = NULL,  -- Important: no payment failure
    updated_at = NOW() - INTERVAL '7 days'  -- Cancelled 7 days ago
WHERE billing_customer_id = (
  SELECT id FROM billing_customers
  WHERE user_id = '<your_test_user_id>'
);
```

**Test Steps:**

1. **Trigger the cron job manually:**

   ```bash
   # Using API key (production)
   curl -H "Authorization: Bearer tA4auCiGFs4DIVKM01ho5xJhKHyzR2XLgB8SEzaitOk=" \
     "https://nextbestmove.app/api/cron/win-back-campaign"

   # Or using query param
   curl "https://nextbestmove.app/api/cron/win-back-campaign?secret=99ad993f6bcf96c3523502f028184b248b30d125a0f2964c012afa338334b0da"
   ```

2. **Check the response:**
   ✅ **Expected:** Response shows `day7Emails: 1` (or more if other users match)

3. **Check email inbox:**
   ✅ **Expected:** Email with subject "What didn't work for you?"
   ✅ **Expected:** Email body includes feedback request
   ✅ **Expected:** CTA: "Reactivate Subscription"

**Verification Checklist:**

- [ ] Email sent on Day 7 after cancellation
- [ ] Subject: "What didn't work for you?"
- [ ] Body includes feedback request
- [ ] CTA: "Reactivate Subscription"
- [ ] Cron response shows `day7Emails: 1`
- [ ] Only sent to voluntary cancellations (not payment failures)

---

### Test 3.2: Day 30 Win-Back Email

**Setup SQL:**

```sql
-- Set user to canceled 30 days ago
UPDATE billing_subscriptions
SET status = 'canceled',
    payment_failed_at = NULL,
    updated_at = NOW() - INTERVAL '30 days'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers
  WHERE user_id = '<your_test_user_id>'
);
```

**Test Steps:**

1. **Trigger the cron job manually** (same command as Test 3.1)
2. **Check the response:**
   ✅ **Expected:** Response shows `day30Emails: 1`
3. **Check email inbox:**
   ✅ **Expected:** Email with subject about new features/updates
   ✅ **Expected:** Email mentions "We shipped updates"

**Verification Checklist:**

- [ ] Email sent on Day 30
- [ ] Subject mentions new features/updates
- [ ] Body includes new features
- [ ] CTA: "Reactivate Subscription"
- [ ] Cron response shows `day30Emails: 1`

---

### Test 3.3: Day 90 Win-Back Email

**Setup SQL:**

```sql
-- Set user to canceled 90 days ago
UPDATE billing_subscriptions
SET status = 'canceled',
    payment_failed_at = NULL,
    updated_at = NOW() - INTERVAL '90 days'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers
  WHERE user_id = '<your_test_user_id>'
);
```

**Test Steps:**

1. **Trigger the cron job manually** (same command as Test 3.1)
2. **Check the response:**
   ✅ **Expected:** Response shows `day90Emails: 1`
3. **Check email inbox:**
   ✅ **Expected:** Email with subject "Your data is still here"
   ✅ **Expected:** Email mentions data retention

**Verification Checklist:**

- [ ] Email sent on Day 90
- [ ] Subject: "Your data is still here"
- [ ] Body mentions data retention
- [ ] CTA: "Reactivate Subscription"
- [ ] Cron response shows `day90Emails: 1`

---

### Test 3.4: Day 180 Win-Back Email

**Setup SQL:**

```sql
-- Set user to canceled 180 days ago
UPDATE billing_subscriptions
SET status = 'canceled',
    payment_failed_at = NULL,
    updated_at = NOW() - INTERVAL '180 days'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers
  WHERE user_id = '<your_test_user_id>'
);
```

**Test Steps:**

1. **Trigger the cron job manually** (same command as Test 3.1)
2. **Check the response:**
   ✅ **Expected:** Response shows `day180Emails: 1`
3. **Check email inbox:**
   ✅ **Expected:** Email with subject "Should we delete your data?"
   ✅ **Expected:** Email mentions data management

**Verification Checklist:**

- [ ] Email sent on Day 180
- [ ] Subject: "Should we delete your data?"
- [ ] Body mentions data management
- [ ] CTA: "Reactivate Subscription"
- [ ] Cron response shows `day180Emails: 1`

---

### Test 3.5: Payment Failures Skipped

**Setup SQL:**

```sql
-- Set user to canceled with payment failure (should be skipped)
UPDATE billing_subscriptions
SET status = 'canceled',
    payment_failed_at = NOW() - INTERVAL '7 days',  -- Has payment failure
    updated_at = NOW() - INTERVAL '7 days'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers
  WHERE user_id = '<your_test_user_id>'
);
```

**Test Steps:**

1. **Trigger the cron job manually** (same command as Test 3.1)
2. **Check the response:**
   ✅ **Expected:** Response shows `skipped: 1` (or more)
   ✅ **Expected:** Response shows `day7Emails: 0` (no email sent)
3. **Check email inbox:**
   ✅ **Expected:** No email sent (payment failures are skipped)

**Verification Checklist:**

- [ ] No email sent for payment failure cancellations
- [ ] Cron response shows `skipped: 1`
- [ ] Cron response shows `day7Emails: 0`

---

## Quick Reference: SQL Scripts

### Reset User to Active Subscription

```sql
-- Reset to active subscription
UPDATE billing_subscriptions
SET status = 'active',
    payment_failed_at = NULL,
    cancel_at_period_end = false,
    current_period_end = NOW() + INTERVAL '30 days',
    metadata = NULL
WHERE billing_customer_id = (
  SELECT id FROM billing_customers
  WHERE user_id = '<your_test_user_id>'
);
```

### Check User's Current State

```sql
-- Check user's subscription status
SELECT
  u.email,
  bs.status,
  bs.payment_failed_at,
  bs.cancel_at_period_end,
  bs.current_period_end,
  bs.metadata,
  CASE
    WHEN bs.payment_failed_at IS NULL THEN 'No payment failure'
    ELSE CONCAT('Payment failed ', CEIL(EXTRACT(EPOCH FROM (NOW() - bs.payment_failed_at)) / 86400), ' days ago')
  END as payment_failure_state
FROM users u
LEFT JOIN billing_customers bc ON bc.user_id = u.id
LEFT JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.email = '<your_test_email>'
ORDER BY bs.created_at DESC
LIMIT 1;
```

---

## Testing Checklist Summary

### Scenario 1: Payment Failure Recovery Flow

- [ ] Day 0: Email sent immediately on payment failure
- [ ] Day 3: Email + modal displayed
- [ ] Day 7: Read-only mode activated
- [ ] Day 14: Account archived (status = canceled)
- [ ] All stages tracked and logged correctly
- [ ] Cron job authentication works

### Scenario 2: Past-Due & Cancellation Banners

- [ ] Banner appears for past-due subscriptions
- [ ] Banner appears for pending cancellations
- [ ] Banner includes billing portal CTA
- [ ] Banner is dismissible
- [ ] No banner for active subscriptions
- [ ] Billing portal opens correctly

### Scenario 3: Win-Back Campaign

- [ ] Day 7 email sent (voluntary cancellations only)
- [ ] Day 30 email sent
- [ ] Day 90 email sent
- [ ] Day 180 email sent
- [ ] Payment failures skipped (no emails)
- [ ] Email content correct for each stage
- [ ] Cron job authentication works

---

## Troubleshooting

**Payment failure email not sending?**

- Check `RESEND_API_KEY` is set in Vercel
- Check user has valid email in database
- Check Resend dashboard for delivery status
- Verify `payment_failed_at` is set correctly
- Check cron job response shows `day3Emails > 0`

**Modal not appearing?**

- Check `payment_failed_at` is exactly 3 days ago
- Check browser console for errors
- Check localStorage for `payment_failure_modal_shown`
- Verify cron job ran successfully
- Check metadata includes `show_payment_failure_modal: true`

**Banner not showing?**

- Check subscription status is `past_due` or `cancel_at_period_end`
- Check browser console for errors
- Verify user has a billing_subscription record
- Check banner component is imported in dashboard

**Win-back email not sending?**

- Check subscription status is `canceled`
- Check `payment_failed_at` is NULL (voluntary cancellation)
- Check `updated_at` matches target day (7, 30, 90, or 180)
- Check Resend dashboard for delivery status
- Verify cron job response shows correct email count

**Cron job failing?**

- Check `CRON_SECRET` or `CRON_JOB_ORG_API_KEY` matches
- Check authorization header format: `Bearer <key>`
- Check server logs for errors
- Verify endpoint is accessible

---

## Success Criteria

✅ **All tests pass**  
✅ **No console errors**  
✅ **No database errors**  
✅ **Emails delivered successfully**  
✅ **Modals and banners display correctly**  
✅ **Cron jobs run successfully**  
✅ **User experience is smooth**  
✅ **No regressions in existing features**

---

_Last updated: January 2025_

