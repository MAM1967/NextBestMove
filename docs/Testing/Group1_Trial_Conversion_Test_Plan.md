# Group 1: Trial & Conversion Optimization - Test Plan

**Date:** November 30, 2025  
**Status:** 📋 Ready for Testing  
**Features:** Trial Expiration, Grace Period, Trial Reminders, Paywall Analytics

---

## Overview

This test plan covers all Group 1 features:
1. **Trial Expiration & Read-Only Grace Period** (Day 15-21)
2. **Trial Reminders** (Day 12 & Day 14 emails)
3. **Paywall Analytics & Copy Polish** (variant messaging, analytics tracking)

---

## Prerequisites

### Test Environment Setup

1. **Stripe Test Mode**
   - Use Stripe test mode with test API keys
   - Create test products/prices for Standard plan
   - Configure webhook endpoint for local testing (use Stripe CLI or ngrok)

2. **Test Users**
   - Create test users with different trial states:
     - User A: Trial ending in 3 days (Day 11)
     - User B: Trial ending in 2 days (Day 12) - for Day 12 reminder
     - User C: Trial ending in 1 day (Day 13)
     - User D: Trial ending today (Day 14) - for Day 14 reminder
     - User E: Trial ended yesterday (Day 15) - in grace period
     - User F: Trial ended 3 days ago (Day 17) - in grace period
     - User G: Trial ended 7 days ago (Day 21) - last day of grace period
     - User H: Trial ended 8+ days ago (Day 22+) - past grace period

3. **Database Setup**
   - Ensure `billing_customers` and `billing_subscriptions` tables are accessible
   - Test users should have:
     - Active `billing_customers` record
     - `billing_subscriptions` with `status = 'trialing'` and `trial_ends_at` set appropriately

4. **Email Testing**
   - Use Resend test mode or check email logs
   - Verify `RESEND_API_KEY` is set
   - Check email delivery in Resend dashboard

5. **Cron Job Setup**
   - For local testing: Manually call `/api/cron/trial-reminders`
   - For production: Configure in cron-job.org
   - Ensure `CRON_SECRET` is set

---

## Test Scenarios

### 1. Trial Expiration & Read-Only Grace Period

#### Test 1.1: Grace Period Detection (Day 15-21)

**Setup:**
- Create user with `trial_ends_at` = 2 days ago (Day 15)
- Subscription status = "canceled" (trial ended, no subscription)

**Steps:**
1. Log in as test user
2. Navigate to dashboard (`/app`)
3. Check for grace period banner
4. Try to generate daily plan (`/app/plan`)
5. Check PaywallOverlay if shown

**Expected Results:**
- ✅ Grace period banner appears at top of dashboard
- ✅ Banner shows "X days left to subscribe"
- ✅ Banner has "Subscribe Now" button linking to `/app/settings`
- ✅ Banner can be dismissed (X button)
- ✅ Plan generation is blocked with error: "Your trial has ended. Subscribe to continue generating daily plans."
- ✅ PaywallOverlay shows grace period message if triggered
- ✅ User can view existing data (read-only mode)

**Test Data:**
```sql
-- Set user to Day 15 (2 days after trial ended)
UPDATE billing_subscriptions 
SET trial_ends_at = NOW() - INTERVAL '2 days',
    status = 'canceled'
WHERE billing_customer_id = (SELECT id FROM billing_customers WHERE user_id = '<test_user_id>');
```

---

#### Test 1.2: Last Day of Grace Period (Day 21)

**Setup:**
- Create user with `trial_ends_at` = 7 days ago (Day 21)
- Subscription status = "canceled"

**Steps:**
1. Log in as test user
2. Navigate to dashboard
3. Check grace period banner message
4. Try to generate plan

**Expected Results:**
- ✅ Banner shows "1 day left" or "0 days left"
- ✅ Plan generation still blocked
- ✅ Grace period logic correctly identifies last day

**Test Data:**
```sql
-- Set user to Day 21 (7 days after trial ended)
UPDATE billing_subscriptions 
SET trial_ends_at = NOW() - INTERVAL '7 days',
    status = 'canceled'
WHERE billing_customer_id = (SELECT id FROM billing_customers WHERE user_id = '<test_user_id>');
```

---

#### Test 1.3: Past Grace Period (Day 22+)

**Setup:**
- Create user with `trial_ends_at` = 8+ days ago
- Subscription status = "canceled"

**Steps:**
1. Log in as test user
2. Navigate to dashboard
3. Check for grace period banner
4. Try to generate plan

**Expected Results:**
- ✅ No grace period banner (grace period ended)
- ✅ Plan generation blocked
- ✅ PaywallOverlay shows standard "Subscribe to unlock" message
- ✅ No grace period messaging

**Test Data:**
```sql
-- Set user to Day 22+ (8+ days after trial ended)
UPDATE billing_subscriptions 
SET trial_ends_at = NOW() - INTERVAL '8 days',
    status = 'canceled'
WHERE billing_customer_id = (SELECT id FROM billing_customers WHERE user_id = '<test_user_id>');
```

---

#### Test 1.4: Active Subscription (No Grace Period)

**Setup:**
- Create user with active subscription
- Subscription status = "active"

**Steps:**
1. Log in as test user
2. Navigate to dashboard
3. Check for grace period banner
4. Generate plan

**Expected Results:**
- ✅ No grace period banner
- ✅ Plan generation works normally
- ✅ No paywall shown

---

#### Test 1.5: Trialing User (No Grace Period Yet)

**Setup:**
- Create user with active trial
- Subscription status = "trialing"
- `trial_ends_at` = 5 days from now

**Steps:**
1. Log in as test user
2. Navigate to dashboard
3. Check for grace period banner
4. Generate plan

**Expected Results:**
- ✅ No grace period banner (still in trial)
- ✅ Plan generation works normally
- ✅ No paywall shown

---

### 2. Trial Reminders

#### Test 2.1: Day 12 Reminder Email (2 Days Remaining)

**Setup:**
- Create user with `trial_ends_at` = 2 days from now
- Subscription status = "trialing"

**Steps:**
1. Manually trigger cron job: `GET /api/cron/trial-reminders` with `Authorization: Bearer <CRON_SECRET>`
2. Check email delivery
3. Verify email content

**Expected Results:**
- ✅ Email sent to user
- ✅ Subject: "2 days left in your trial — Keep your rhythm going"
- ✅ Body includes encouraging message
- ✅ CTA button: "Subscribe Now"
- ✅ Link points to `/app/settings`
- ✅ Console log shows: "Trial reminder sent" with `daysRemaining: 2`

**Test Data:**
```sql
-- Set user to Day 12 (2 days remaining)
UPDATE billing_subscriptions 
SET trial_ends_at = NOW() + INTERVAL '2 days',
    status = 'trialing'
WHERE billing_customer_id = (SELECT id FROM billing_customers WHERE user_id = '<test_user_id>');
```

**Manual Test:**
```bash
curl -X GET "http://localhost:3000/api/cron/trial-reminders" \
  -H "Authorization: Bearer <CRON_SECRET>"
```

---

#### Test 2.2: Day 14 Reminder Email (0 Days Remaining)

**Setup:**
- Create user with `trial_ends_at` = today (0 days remaining)
- Subscription status = "trialing"

**Steps:**
1. Manually trigger cron job
2. Check email delivery
3. Verify email content

**Expected Results:**
- ✅ Email sent to user
- ✅ Subject: "Last day of trial — Subscribe to keep your rhythm"
- ✅ Body includes urgent message about read-only mode
- ✅ CTA button: "Subscribe Now — Last Chance"
- ✅ Mentions grace period (7-day read-only mode)
- ✅ Console log shows: "Trial reminder sent" with `daysRemaining: 0`

**Test Data:**
```sql
-- Set user to Day 14 (0 days remaining - today)
UPDATE billing_subscriptions 
SET trial_ends_at = CURRENT_DATE,
    status = 'trialing'
WHERE billing_customer_id = (SELECT id FROM billing_customers WHERE user_id = '<test_user_id>');
```

---

#### Test 2.3: Cron Job Skips Non-Reminder Days

**Setup:**
- Create users with various days remaining (1, 3, 5, 10 days)

**Steps:**
1. Trigger cron job
2. Check email delivery

**Expected Results:**
- ✅ No emails sent for days other than 2 and 0
- ✅ Console log shows: "No reminders needed" or similar
- ✅ Only Day 12 and Day 14 users receive emails

---

#### Test 2.4: Cron Job Error Handling

**Setup:**
- Create user with invalid email or missing user data

**Steps:**
1. Trigger cron job
2. Check error handling

**Expected Results:**
- ✅ Error logged but cron job continues
- ✅ Other users still receive emails
- ✅ Returns success with `errors` count > 0
- ✅ Response includes: `{ success: true, remindersSent: X, errors: Y }`

---

#### Test 2.5: Cron Job Authentication

**Steps:**
1. Call cron endpoint without auth header
2. Call with wrong secret
3. Call with correct secret

**Expected Results:**
- ✅ Without auth: Returns 401 Unauthorized
- ✅ Wrong secret: Returns 401 Unauthorized
- ✅ Correct secret: Returns 200 with results

---

### 3. Paywall Analytics & Copy Polish

#### Test 3.1: Paywall Variant - Trial Users

**Setup:**
- User with no subscription (new user)

**Steps:**
1. Navigate to gated page (e.g., `/app/plan` without plan)
2. Check PaywallOverlay
3. Check browser console for analytics logs

**Expected Results:**
- ✅ Headline: "Subscribe to unlock this feature"
- ✅ Description: "Start your 14-day free trial. No credit card required."
- ✅ CTA: "Start Free Trial"
- ✅ Console log: `[Paywall Analytics] Paywall viewed` with `status: "none"`
- ✅ "Maybe Later" button available

---

#### Test 3.2: Paywall Variant - Past Due Users

**Setup:**
- User with `status = "past_due"`

**Steps:**
1. Navigate to gated page
2. Check PaywallOverlay
3. Click "Update Payment Method"
4. Check console logs

**Expected Results:**
- ✅ Headline: "Payment failed — Update to keep your streak alive"
- ✅ Description: "Update your payment method to keep your rhythm going. Your data is safe."
- ✅ CTA: "Update Payment Method" (amber button)
- ✅ Amber badge: "Payment Failed"
- ✅ No "Maybe Later" button (or dismissible)
- ✅ Console log: `[Paywall Analytics] Paywall viewed` with `status: "past_due"`
- ✅ Console log: `[Paywall Analytics] Update payment CTA clicked` when clicked

**Test Data:**
```sql
UPDATE billing_subscriptions 
SET status = 'past_due'
WHERE billing_customer_id = (SELECT id FROM billing_customers WHERE user_id = '<test_user_id>');
```

---

#### Test 3.3: Paywall Variant - Canceled Users

**Setup:**
- User with `status = "canceled"` and past grace period

**Steps:**
1. Navigate to gated page
2. Check PaywallOverlay
3. Check console logs

**Expected Results:**
- ✅ Headline: "Your plan is paused"
- ✅ Description: "Reactivate anytime — your data stays safe. Subscribe to resume your rhythm."
- ✅ CTA: "Reactivate Subscription"
- ✅ Console log: `[Paywall Analytics] Paywall viewed` with `status: "canceled"`

**Test Data:**
```sql
UPDATE billing_subscriptions 
SET status = 'canceled',
    trial_ends_at = NOW() - INTERVAL '10 days'
WHERE billing_customer_id = (SELECT id FROM billing_customers WHERE user_id = '<test_user_id>');
```

---

#### Test 3.4: Paywall Variant - Grace Period

**Setup:**
- User in grace period (Day 15-21)

**Steps:**
1. Navigate to gated page
2. Check PaywallOverlay
3. Check console logs

**Expected Results:**
- ✅ Headline: "Your trial has ended"
- ✅ Description: Shows days remaining in grace period
- ✅ CTA: "Subscribe Now"
- ✅ "Continue in Read-Only Mode" button available
- ✅ Console log: `[Paywall Analytics] Paywall viewed` with `status: "grace_period"`

---

#### Test 3.5: Analytics Tracking - Subscribe CTA

**Steps:**
1. Open PaywallOverlay
2. Click "Subscribe Now" or "Start Free Trial"
3. Check console logs

**Expected Results:**
- ✅ Console log: `[Paywall Analytics] Subscribe CTA clicked`
- ✅ Console log: `[Paywall Analytics] Checkout session created` (if successful)
- ✅ Redirects to Stripe checkout
- ✅ Analytics include status and timestamp

---

#### Test 3.6: Analytics Tracking - Dismiss

**Steps:**
1. Open PaywallOverlay
2. Click "Maybe Later" or dismiss button
3. Check console logs

**Expected Results:**
- ✅ Console log: `[Paywall Analytics] Paywall dismissed`
- ✅ Paywall closes
- ✅ Analytics include status and timestamp

---

#### Test 3.7: Analytics Tracking - Error Handling

**Steps:**
1. Open PaywallOverlay
2. Simulate checkout error (disable API endpoint temporarily)
3. Check console logs

**Expected Results:**
- ✅ Console log: `[Paywall Analytics] Checkout error`
- ✅ Error details logged
- ✅ User sees error message
- ✅ Analytics include error information

---

## Integration Tests

### Test 4.1: End-to-End Trial Flow

**Scenario:** User goes through complete trial lifecycle

**Steps:**
1. **Day 1:** User signs up, starts trial
   - Verify: Trial active, can generate plans
2. **Day 12:** Trigger reminder cron
   - Verify: Day 12 email sent
3. **Day 14:** Trigger reminder cron
   - Verify: Day 14 email sent
4. **Day 15:** Trial ends (simulate via Stripe webhook or manual update)
   - Verify: Grace period banner appears
   - Verify: Plan generation blocked
5. **Day 18:** User still in grace period
   - Verify: Banner shows days remaining
   - Verify: Still read-only
6. **Day 22:** Grace period ends
   - Verify: Banner no longer shows
   - Verify: Standard paywall shown

**Expected Results:**
- ✅ All transitions work correctly
- ✅ No data loss
- ✅ User can subscribe at any point
- ✅ Analytics tracked throughout

---

### Test 4.2: Subscription During Grace Period

**Steps:**
1. User in grace period (Day 17)
2. User clicks "Subscribe Now" from banner
3. Complete Stripe checkout
4. Verify subscription activated

**Expected Results:**
- ✅ Redirects to Stripe checkout
- ✅ After checkout: Subscription status = "active"
- ✅ Grace period banner disappears
- ✅ Plan generation works
- ✅ Analytics tracked

---

## Edge Cases

### Test 5.1: Missing Trial End Date

**Setup:**
- User with `trial_ends_at = null`

**Expected Results:**
- ✅ No grace period detected
- ✅ No errors thrown
- ✅ Handles gracefully

---

### Test 5.2: Multiple Subscriptions

**Setup:**
- User with multiple subscription records

**Expected Results:**
- ✅ Uses most recent subscription
- ✅ Grace period logic works correctly
- ✅ No duplicate banners

---

### Test 5.3: Timezone Edge Cases

**Setup:**
- User in different timezone
- Trial ends at midnight in user's timezone

**Expected Results:**
- ✅ Grace period calculation uses correct timezone
- ✅ Days remaining calculated correctly
- ✅ No off-by-one errors

---

### Test 5.4: Concurrent Plan Generation

**Steps:**
1. User in grace period
2. Try to generate plan from multiple tabs simultaneously

**Expected Results:**
- ✅ All requests blocked
- ✅ Consistent error message
- ✅ No race conditions

---

## Performance Tests

### Test 6.1: Cron Job Performance

**Setup:**
- 1000+ users with various trial states

**Steps:**
1. Trigger cron job
2. Measure execution time

**Expected Results:**
- ✅ Completes in < 30 seconds
- ✅ Handles large user base
- ✅ No timeouts

---

### Test 6.2: Dashboard Load Time

**Steps:**
1. User in grace period
2. Measure dashboard load time

**Expected Results:**
- ✅ Loads in < 2 seconds
- ✅ Subscription query optimized
- ✅ No N+1 queries

---

## Regression Tests

### Test 7.1: Existing Features Still Work

**Verify:**
- ✅ Active subscribers can generate plans
- ✅ Trialing users can generate plans
- ✅ Settings page works
- ✅ Billing section displays correctly
- ✅ No breaking changes to existing flows

---

## Test Checklist

### Trial Expiration & Grace Period
- [ ] Grace period banner appears (Day 15-21)
- [ ] Banner shows correct days remaining
- [ ] Banner can be dismissed
- [ ] Plan generation blocked during grace period
- [ ] PaywallOverlay shows grace period message
- [ ] No banner after grace period ends
- [ ] Active subscribers not affected
- [ ] Trialing users not affected

### Trial Reminders
- [ ] Day 12 email sent (2 days remaining)
- [ ] Day 14 email sent (0 days remaining)
- [ ] Other days don't trigger emails
- [ ] Email content correct
- [ ] Email links work
- [ ] Cron job authentication works
- [ ] Error handling works
- [ ] Multiple users handled correctly

### Paywall Analytics
- [ ] Variant messaging for trial users
- [ ] Variant messaging for past-due users
- [ ] Variant messaging for canceled users
- [ ] Variant messaging for grace period
- [ ] Analytics logged for paywall views
- [ ] Analytics logged for CTA clicks
- [ ] Analytics logged for dismissals
- [ ] Analytics logged for errors

### Integration
- [ ] End-to-end trial flow works
- [ ] Subscription during grace period works
- [ ] Edge cases handled
- [ ] Performance acceptable
- [ ] No regressions

---

## Test Data SQL Scripts

### Create Test Users

```sql
-- Helper function to create test user with subscription
-- Replace <email> and <user_id> with actual values

-- User in Day 12 (2 days remaining)
INSERT INTO billing_customers (user_id, stripe_customer_id, currency)
VALUES ('<user_id>', 'cus_test_day12', 'usd')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO billing_subscriptions (
  billing_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  status,
  current_period_end,
  trial_ends_at,
  metadata
)
SELECT 
  bc.id,
  'sub_test_day12',
  'price_test',
  'trialing',
  NOW() + INTERVAL '2 days',
  NOW() + INTERVAL '2 days',
  '{"plan_name": "Standard", "plan_type": "standard", "interval": "month"}'::jsonb
FROM billing_customers bc
WHERE bc.user_id = '<user_id>'
ON CONFLICT (stripe_subscription_id) DO UPDATE
SET trial_ends_at = NOW() + INTERVAL '2 days',
    status = 'trialing';
```

---

## Manual Testing Steps

### Quick Test (5 minutes)

1. **Grace Period Banner:**
   ```sql
   -- Set test user to Day 17 (3 days into grace period)
   UPDATE billing_subscriptions 
   SET trial_ends_at = NOW() - INTERVAL '3 days',
       status = 'canceled'
   WHERE billing_customer_id = (SELECT id FROM billing_customers WHERE user_id = '<test_user_id>');
   ```
   - Log in → Check dashboard for banner
   - Try to generate plan → Should be blocked

2. **Trial Reminder:**
   ```sql
   -- Set test user to Day 12
   UPDATE billing_subscriptions 
   SET trial_ends_at = NOW() + INTERVAL '2 days',
       status = 'trialing'
   WHERE billing_customer_id = (SELECT id FROM billing_customers WHERE user_id = '<test_user_id>');
   ```
   - Call cron endpoint → Check email

3. **Paywall Variants:**
   - Navigate to `/app/plan` without plan
   - Check PaywallOverlay message
   - Check console for analytics logs

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

## Notes

- **Stripe Test Mode:** Use test mode for all Stripe operations
- **Email Testing:** Check Resend dashboard for email delivery
- **Local Testing:** Use Stripe CLI for webhook testing: `stripe listen --forward-to localhost:3000/api/billing/webhook`
- **Cron Testing:** Manually call endpoint or use cron-job.org test feature
- **Time Manipulation:** Use SQL to adjust `trial_ends_at` dates for testing different states

---

_Last updated: November 30, 2025_

