# Group 1 Complete Testing Guide - All 3 Scenarios

**Date:** December 1, 2025  
**Status:** 📋 Ready for Testing  
**Features:**

1. Trial Expiration & Read-Only Grace Period (Day 15-21)
2. Trial Reminders (Day 12 & Day 14 emails)
3. Paywall Analytics & Copy Polish (variant messaging, analytics tracking)

---

## Prerequisites

1. **Test User Account** - You'll need at least one test user account
2. **Supabase Access** - To run SQL scripts for test data setup
3. **Email Access** - To verify trial reminder emails
4. **Browser Console** - Open DevTools to check analytics logs
5. **CRON_SECRET** - For testing trial reminder cron endpoint

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

## Scenario 1: Grace Period Banner (Day 15-21)

### Test 1.1: Grace Period Day 3 (Day 17)

**Setup SQL:**

```sql
-- Set user to Day 17 (3 days into grace period)
UPDATE billing_subscriptions
SET trial_ends_at = NOW() - INTERVAL '3 days',
    status = 'canceled'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers
  WHERE user_id = '<your_test_user_id>'
);
```

**Test Steps:**

1. Log in as test user
2. Navigate to `/app` (dashboard)
3. ✅ **Expected:** Amber banner at top saying "Your trial has ended - You have X days left to subscribe"
4. Check the days remaining calculation (should show ~4 days remaining)
5. Click "Subscribe Now" → Should navigate to settings page
6. Try to generate plan at `/app/plan`
7. ✅ **Expected:** Error message or PaywallOverlay showing "Your trial has ended. Subscribe to continue generating daily plans."

**Verification Checklist:**

- [ ] Banner appears at top of dashboard
- [ ] Banner shows correct days remaining (4 days)
- [ ] Banner has "Subscribe Now" button
- [ ] Banner can be dismissed (X button)
- [ ] Plan generation is blocked
- [ ] User can still view existing data (read-only mode)

---

### Test 1.2: Last Day of Grace Period (Day 21)

**Setup SQL:**

```sql
-- Set user to Day 21 (7 days after trial ended - last day of grace period)
UPDATE billing_subscriptions
SET trial_ends_at = NOW() - INTERVAL '7 days',
    status = 'canceled'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers
  WHERE user_id = '<your_test_user_id>'
);
```

**Test Steps:**

1. Log in as test user
2. Navigate to dashboard
3. ✅ **Expected:** Banner shows "1 day left" or "0 days left"
4. Try to generate plan
5. ✅ **Expected:** Still blocked, grace period logic correctly identifies last day

**Verification Checklist:**

- [ ] Banner shows "1 day left" or "0 days left"
- [ ] Plan generation still blocked
- [ ] Grace period logic correctly identifies last day

---

### Test 1.3: Past Grace Period (Day 22+)

**Setup SQL:**

```sql
-- Set user to Day 22+ (past grace period)
UPDATE billing_subscriptions
SET trial_ends_at = NOW() - INTERVAL '8 days',
    status = 'canceled'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers
  WHERE user_id = '<your_test_user_id>'
);
```

**Test Steps:**

1. Log in as test user
2. Navigate to dashboard
3. ✅ **Expected:** No grace period banner (grace period ended)
4. Try to generate plan
5. ✅ **Expected:** PaywallOverlay shows standard "Subscribe to unlock" message (not grace period specific)

**Verification Checklist:**

- [ ] No grace period banner
- [ ] Plan generation blocked
- [ ] PaywallOverlay shows standard message (not grace period)
- [ ] No grace period messaging

---

## Scenario 2: Trial Reminder Emails (Day 12 & Day 14)

### Test 2.1: Day 12 Reminder Email (2 Days Remaining)

**Setup SQL:**

```sql
-- Set user to Day 12 (2 days remaining)
UPDATE billing_subscriptions
SET trial_ends_at = NOW() + INTERVAL '2 days',
    status = 'trialing'
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
     "https://nextbestmove.app/api/cron/trial-reminders"

   # Or using query param
   curl "https://nextbestmove.app/api/cron/trial-reminders?secret=99ad993f6bcf96c3523502f028184b248b30d125a0f2964c012afa338334b0da"
   ```

2. **Check the response:**
   ✅ **Expected:** Response shows `remindersSent: 1` (or more if other users match)

3. **Check email inbox:**
   ✅ **Expected:** Email with subject "2 days left in your trial — Keep your rhythm going"
   ✅ **Expected:** Email body includes encouraging message
   ✅ **Expected:** CTA button: "Subscribe Now"
   ✅ **Expected:** Link points to `/app/settings`

**Verification Checklist:**

- [ ] Email sent to user
- [ ] Subject: "2 days left in your trial — Keep your rhythm going"
- [ ] Body includes encouraging message
- [ ] CTA button: "Subscribe Now"
- [ ] Link points to `/app/settings`
- [ ] Cron response shows `remindersSent: 1`

---

### Test 2.2: Day 14 Reminder Email (0 Days Remaining)

**Setup SQL:**

```sql
-- Set user to Day 14 (0 days remaining - today)
UPDATE billing_subscriptions
SET trial_ends_at = CURRENT_DATE,
    status = 'trialing'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers
  WHERE user_id = '<your_test_user_id>'
);
```

**Test Steps:**

1. **Trigger the cron job manually** (same command as above)

2. **Check the response:**
   ✅ **Expected:** Response shows `remindersSent: 1`

3. **Check email inbox:**
   ✅ **Expected:** Email with subject "Last day of trial — Subscribe to keep your rhythm"
   ✅ **Expected:** Body includes urgent message about read-only mode
   ✅ **Expected:** CTA button: "Subscribe Now — Last Chance"
   ✅ **Expected:** Mentions grace period (7-day read-only mode)

**Verification Checklist:**

- [ ] Email sent to user
- [ ] Subject: "Last day of trial — Subscribe to keep your rhythm"
- [ ] Body includes urgent message
- [ ] CTA button: "Subscribe Now — Last Chance"
- [ ] Mentions grace period
- [ ] Cron response shows `remindersSent: 1`

---

### Test 2.3: Verify Other Days Don't Trigger Emails

**Setup SQL:**

```sql
-- Set user to Day 11 (3 days remaining - should NOT trigger)
UPDATE billing_subscriptions
SET trial_ends_at = NOW() + INTERVAL '3 days',
    status = 'trialing'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers
  WHERE user_id = '<your_test_user_id>'
);
```

**Test Steps:**

1. Trigger cron job
2. ✅ **Expected:** No email sent (only Day 12 and Day 14 trigger emails)
3. ✅ **Expected:** Response shows `remindersSent: 0` (unless other users match)

**Verification Checklist:**

- [ ] No email sent for Day 11
- [ ] Only Day 12 and Day 14 users receive emails

---

## Scenario 3: Paywall Variants & Analytics

### Test 3.1: Paywall Variant - Past Due User

**Setup SQL:**

```sql
-- Set user to past_due status
UPDATE billing_subscriptions
SET status = 'past_due'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers
  WHERE user_id = '<your_test_user_id>'
);
```

**Test Steps:**

1. Log in as test user
2. Navigate to `/app/plan` (without existing plan)
3. Open browser DevTools Console (F12)
4. ✅ **Expected:** PaywallOverlay appears with:
   - Headline: "Payment failed — Update to keep your streak alive"
   - Description: "Update your payment method to keep your rhythm going. Your data is safe."
   - CTA: "Update Payment Method" (amber button)
   - Amber badge: "Payment Failed"
   - No "Maybe Later" button (or dismissible)
5. Check console logs:
   ✅ **Expected:** `[Paywall Analytics] Paywall viewed` with `status: "past_due"`
6. Click "Update Payment Method"
7. ✅ **Expected:** Console log: `[Paywall Analytics] Update payment CTA clicked`

**Verification Checklist:**

- [ ] PaywallOverlay shows past_due variant
- [ ] Headline: "Payment failed — Update to keep your streak alive"
- [ ] Amber button styling
- [ ] Console log: `[Paywall Analytics] Paywall viewed` with `status: "past_due"`
- [ ] Console log: `[Paywall Analytics] Update payment CTA clicked` when clicked

---

### Test 3.2: Paywall Variant - Canceled User

**Setup SQL:**

```sql
-- Set user to canceled status (past grace period)
UPDATE billing_subscriptions
SET status = 'canceled',
    trial_ends_at = NOW() - INTERVAL '10 days'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers
  WHERE user_id = '<your_test_user_id>'
);
```

**Test Steps:**

1. Log in as test user
2. Navigate to `/app/plan` (without existing plan)
3. Open browser DevTools Console
4. ✅ **Expected:** PaywallOverlay appears with:
   - Headline: "Your plan is paused"
   - Description: "Reactivate anytime — your data stays safe. Subscribe to resume your rhythm."
   - CTA: "Reactivate Subscription"
5. Check console logs:
   ✅ **Expected:** `[Paywall Analytics] Paywall viewed` with `status: "canceled"`
6. Click "Reactivate Subscription"
7. ✅ **Expected:** Console log: `[Paywall Analytics] Subscribe CTA clicked`

**Verification Checklist:**

- [ ] PaywallOverlay shows canceled variant
- [ ] Headline: "Your plan is paused"
- [ ] CTA: "Reactivate Subscription"
- [ ] Console log: `[Paywall Analytics] Paywall viewed` with `status: "canceled"`
- [ ] Console log: `[Paywall Analytics] Subscribe CTA clicked` when clicked

---

### Test 3.3: Paywall Variant - Grace Period

**Setup SQL:**

```sql
-- Set user to grace period (Day 17)
UPDATE billing_subscriptions
SET trial_ends_at = NOW() - INTERVAL '3 days',
    status = 'canceled'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers
  WHERE user_id = '<your_test_user_id>'
);
```

**Test Steps:**

1. Log in as test user
2. Navigate to `/app/plan` (without existing plan)
3. Open browser DevTools Console
4. ✅ **Expected:** PaywallOverlay appears with:
   - Headline: "Your trial has ended"
   - Description: Shows days remaining in grace period
   - CTA: "Subscribe Now"
   - "Continue in Read-Only Mode" button available (if implemented)
5. Check console logs:
   ✅ **Expected:** `[Paywall Analytics] Paywall viewed` with `status: "grace_period"`

**Verification Checklist:**

- [ ] PaywallOverlay shows grace period variant
- [ ] Headline: "Your trial has ended"
- [ ] Description shows days remaining
- [ ] CTA: "Subscribe Now"
- [ ] Console log: `[Paywall Analytics] Paywall viewed` with `status: "grace_period"`

---

### Test 3.4: Paywall Variant - Trial User (No Subscription)

**Setup SQL:**

```sql
-- Remove subscription (new user state)
DELETE FROM billing_subscriptions
WHERE billing_customer_id = (
  SELECT id FROM billing_customers
  WHERE user_id = '<your_test_user_id>'
);

-- Or set to no customer
DELETE FROM billing_customers
WHERE user_id = '<your_test_user_id>';
```

**Test Steps:**

1. Log in as test user
2. Navigate to `/app/plan` (without existing plan)
3. Open browser DevTools Console
4. ✅ **Expected:** PaywallOverlay appears with:
   - Headline: "Subscribe to unlock this feature"
   - Description: "Start your 14-day free trial. No credit card required."
   - CTA: "Start Free Trial"
   - "Maybe Later" button available
5. Check console logs:
   ✅ **Expected:** `[Paywall Analytics] Paywall viewed` with `status: "none"`

**Verification Checklist:**

- [ ] PaywallOverlay shows trial variant
- [ ] Headline: "Subscribe to unlock this feature"
- [ ] CTA: "Start Free Trial"
- [ ] "Maybe Later" button available
- [ ] Console log: `[Paywall Analytics] Paywall viewed` with `status: "none"`

---

## Quick Reference: SQL Scripts

### Reset User to Active Subscription

```sql
-- Reset to active subscription
UPDATE billing_subscriptions
SET status = 'active',
    trial_ends_at = NULL,
    current_period_end = NOW() + INTERVAL '30 days'
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
  bs.trial_ends_at,
  CASE
    WHEN bs.trial_ends_at IS NULL THEN 'No trial'
    WHEN bs.trial_ends_at > NOW() THEN CONCAT('Trial ends in ', CEIL(EXTRACT(EPOCH FROM (bs.trial_ends_at - NOW())) / 86400), ' days')
    WHEN bs.trial_ends_at > NOW() - INTERVAL '7 days' THEN CONCAT('Grace period: ', CEIL(EXTRACT(EPOCH FROM (NOW() - bs.trial_ends_at)) / 86400), ' days in')
    ELSE 'Past grace period'
  END as trial_state
FROM users u
LEFT JOIN billing_customers bc ON bc.user_id = u.id
LEFT JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.email = '<your_test_email>'
ORDER BY bs.created_at DESC
LIMIT 1;
```

---

## Testing Checklist Summary

### Scenario 1: Grace Period Banner

- [ ] Banner appears (Day 15-21)
- [ ] Banner shows correct days remaining
- [ ] Banner can be dismissed
- [ ] Plan generation blocked during grace period
- [ ] No banner after grace period ends
- [ ] Active subscribers not affected

### Scenario 2: Trial Reminders

- [ ] Day 12 email sent (2 days remaining)
- [ ] Day 14 email sent (0 days remaining)
- [ ] Other days don't trigger emails
- [ ] Email content correct
- [ ] Email links work
- [ ] Cron job authentication works

### Scenario 3: Paywall Variants

- [ ] Variant messaging for past-due users
- [ ] Variant messaging for canceled users
- [ ] Variant messaging for grace period
- [ ] Variant messaging for trial users
- [ ] Analytics logged for paywall views
- [ ] Analytics logged for CTA clicks
- [ ] Analytics logged for dismissals

---

## Troubleshooting

**Banner not showing?**

- Check subscription status is "canceled"
- Check `trial_ends_at` is within last 7 days
- Check browser console for errors
- Verify user has a billing_subscription record

**Email not sending?**

- Check `RESEND_API_KEY` is set in Vercel
- Check user has valid email in database
- Check Resend dashboard for delivery status
- Verify cron job response shows `remindersSent > 0`

**Paywall not showing correct variant?**

- Check subscription status in database
- Check browser console for errors
- Verify PaywallOverlay component receives correct status
- Check analytics logs in console

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
✅ **Analytics tracked correctly**  
✅ **User experience is smooth**  
✅ **No regressions in existing features**

---

_Last updated: December 1, 2025_
