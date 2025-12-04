# Group 5 Complete Testing Guide - Streak Break Detection & Recovery

**Date:** January 2025  
**Status:** 📋 Ready for Testing  
**Feature:** Streak Break Detection & Recovery

---

## Overview

This feature detects when users break their streak (no actions completed for 1+ days) and sends recovery notifications at strategic intervals:

- **Day 1:** Push notification (logged, infrastructure not yet implemented)
- **Day 2:** Micro Mode automatically enabled (handled by plan generation)
- **Day 3:** Personal email via Resend
- **Day 7:** Billing pause offer email (for users with active subscriptions)

---

## Prerequisites

1. **Test User Account** - You'll need at least one test user account
2. **Supabase Access** - To run SQL scripts for test data setup
3. **Resend API Key** - For email testing
4. **CRON_SECRET** - For testing the cron endpoint
5. **Browser Console** - Open DevTools to check for errors

---

## Test User Setup

**Recommended Test User:** `mcddsl@icloud.com` (UUID: `047fa9df-1464-4f69-a906-0166a0d76091`)

You can find your test user with:

```sql
-- Find your test user
SELECT id, email, name, streak_count, last_action_date, created_at, metadata
FROM users
WHERE email = 'mcddsl@icloud.com';
```

---

## Test 1: Day 1 Streak Break Detection

**Goal:** Verify that Day 1 streak break is detected and logged (push notification placeholder)

**Setup SQL:**

```sql
-- Set up user with broken streak (1 day inactive)
-- Replace 'mcddsl@icloud.com' with your test email
WITH user_info AS (
  SELECT id as user_id
  FROM users
  WHERE email = 'mcddsl@icloud.com'
  LIMIT 1
)
-- Set streak_count to 0 and last_action_date to 1 day ago
UPDATE users
SET 
  streak_count = 0,
  last_action_date = CURRENT_DATE - INTERVAL '1 day',
  metadata = jsonb_build_object(
    'streak_notifications', jsonb_build_object()
  )
WHERE id = (SELECT user_id FROM user_info);

-- Verify setup
SELECT 
  id, 
  email, 
  streak_count, 
  last_action_date,
  CURRENT_DATE - last_action_date as days_inactive,
  metadata->'streak_notifications' as notifications
FROM users
WHERE email = 'mcddsl@icloud.com';
-- Should show: streak_count = 0, days_inactive = 1
```

**Test Steps:**

1. **Set up user with 1 day inactive** (run setup SQL above)

2. **Trigger streak recovery cron job:**

   ```bash
   curl -X GET "http://localhost:3000/api/cron/streak-recovery?secret=YOUR_CRON_SECRET"
   ```

   Or in production:
   ```bash
   curl -X GET "https://nextbestmove.app/api/cron/streak-recovery?secret=YOUR_CRON_SECRET"
   ```

3. **Check response:**

   ```json
   {
     "success": true,
     "message": "Streak recovery cron completed",
     "processed": 1,
     "day1PushNotifications": 1,
     "day2MicroModeDetected": 0,
     "day3EmailsSent": 0,
     "day7BillingPauseOffers": 0
   }
   ```

4. **Verify metadata updated:**

   ```sql
   SELECT metadata->'streak_notifications' as notifications
   FROM users
   WHERE email = 'mcddsl@icloud.com';
   -- Should show: {"day1_sent": true, "last_day": 1, "last_notification_date": "2025-01-XX"}
   ```

**Expected Results:**

- ✅ Day 1 detection logged in cron job response
- ✅ Metadata updated with `day1_sent: true`
- ✅ No duplicate notifications if cron runs again

---

## Test 2: Day 2 Micro Mode Activation

**Goal:** Verify that Micro Mode is automatically enabled on Day 2 (handled by plan generation)

**Setup SQL:**

```sql
-- Set up user with 2 days inactive
WITH user_info AS (
  SELECT id as user_id
  FROM users
  WHERE email = 'mcddsl@icloud.com'
  LIMIT 1
)
UPDATE users
SET 
  streak_count = 0,
  last_action_date = CURRENT_DATE - INTERVAL '2 days',
  metadata = jsonb_build_object(
    'streak_notifications', jsonb_build_object()
  )
WHERE id = (SELECT user_id FROM user_info);

-- Verify setup
SELECT 
  id, 
  email, 
  streak_count, 
  last_action_date,
  CURRENT_DATE - last_action_date as days_inactive
FROM users
WHERE email = 'mcddsl@icloud.com';
-- Should show: streak_count = 0, days_inactive = 2
```

**Test Steps:**

1. **Set up user with 2 days inactive** (run setup SQL above)

2. **Trigger streak recovery cron job:**

   ```bash
   curl -X GET "http://localhost:3000/api/cron/streak-recovery?secret=YOUR_CRON_SECRET"
   ```

3. **Check response:**

   ```json
   {
     "success": true,
     "day2MicroModeDetected": 1,
     "day1PushNotifications": 0,
     "day3EmailsSent": 0
   }
   ```

4. **Generate daily plan** (this is where Micro Mode is actually applied):

   ```bash
   curl -X POST "http://localhost:3000/api/daily-plans/generate" \
     -H "Cookie: your-session-cookie" \
     -H "Content-Type: application/json" \
     -d '{"date": "'$(date +%Y-%m-%d)'"}'
   ```

5. **Verify plan is Micro Mode:**

   ```sql
   SELECT 
     dp.id,
     dp.date,
     dp.capacity_level,
     dp.adaptive_reason,
     COUNT(dpa.id) as action_count
   FROM daily_plans dp
   LEFT JOIN daily_plan_actions dpa ON dpa.daily_plan_id = dp.id
   WHERE dp.user_id = (SELECT id FROM users WHERE email = 'mcddsl@icloud.com')
     AND dp.date = CURRENT_DATE
   GROUP BY dp.id, dp.date, dp.capacity_level, dp.adaptive_reason;
   -- Should show: capacity_level = 'micro', adaptive_reason = 'streak_break', action_count = 2
   ```

**Expected Results:**

- ✅ Day 2 detection logged in cron job response
- ✅ Metadata updated with `day2_detected: true`
- ✅ Daily plan generated with Micro Mode (2 actions, `adaptive_reason: "streak_break"`)

---

## Test 3: Day 3 Recovery Email

**Goal:** Verify that Day 3 recovery email is sent via Resend

**Setup SQL:**

```sql
-- Set up user with 3 days inactive
WITH user_info AS (
  SELECT id as user_id
  FROM users
  WHERE email = 'mcddsl@icloud.com'
  LIMIT 1
)
UPDATE users
SET 
  streak_count = 0,
  last_action_date = CURRENT_DATE - INTERVAL '3 days',
  metadata = jsonb_build_object(
    'streak_notifications', jsonb_build_object()
  )
WHERE id = (SELECT user_id FROM user_info);

-- Verify setup
SELECT 
  id, 
  email, 
  streak_count, 
  last_action_date,
  CURRENT_DATE - last_action_date as days_inactive
FROM users
WHERE email = 'mcddsl@icloud.com';
-- Should show: streak_count = 0, days_inactive = 3
```

**Test Steps:**

1. **Set up user with 3 days inactive** (run setup SQL above)

2. **Trigger streak recovery cron job:**

   ```bash
   curl -X GET "http://localhost:3000/api/cron/streak-recovery?secret=YOUR_CRON_SECRET"
   ```

3. **Check response:**

   ```json
   {
     "success": true,
     "day3EmailsSent": 1,
     "day1PushNotifications": 0,
     "day2MicroModeDetected": 0,
     "day7BillingPauseOffers": 0
   }
   ```

4. **Check email inbox** - Should receive email with:
   - Subject: "Let's get your streak back on track"
   - Personal greeting
   - Link to comeback plan
   - Encouraging message

5. **Verify metadata updated:**

   ```sql
   SELECT metadata->'streak_notifications' as notifications
   FROM users
   WHERE email = 'mcddsl@icloud.com';
   -- Should show: {"day3_sent": true, "last_day": 3, "last_notification_date": "2025-01-XX"}
   ```

6. **Verify no duplicate email** - Run cron again:

   ```bash
   curl -X GET "http://localhost:3000/api/cron/streak-recovery?secret=YOUR_CRON_SECRET"
   ```

   Response should show `day3EmailsSent: 0` (already sent)

**Expected Results:**

- ✅ Day 3 email sent successfully
- ✅ Email received in inbox with correct content
- ✅ Metadata updated with `day3_sent: true`
- ✅ No duplicate emails on subsequent cron runs

---

## Test 4: Day 7 Billing Pause Offer

**Goal:** Verify that Day 7 billing pause offer email is sent to users with active subscriptions

**Setup SQL:**

```sql
-- Set up user with 7 days inactive AND active subscription
WITH user_info AS (
  SELECT id as user_id
  FROM users
  WHERE email = 'mcddsl@icloud.com'
  LIMIT 1
),
billing_info AS (
  SELECT bc.id as customer_id
  FROM billing_customers bc
  WHERE bc.user_id = (SELECT user_id FROM user_info)
  LIMIT 1
)
-- Update user to 7 days inactive
UPDATE users
SET 
  streak_count = 0,
  last_action_date = CURRENT_DATE - INTERVAL '7 days',
  metadata = jsonb_build_object(
    'streak_notifications', jsonb_build_object()
  )
WHERE id = (SELECT user_id FROM user_info);

-- Ensure user has active subscription (if not, create one in Stripe Dashboard)
-- Verify setup
SELECT 
  u.id, 
  u.email, 
  u.streak_count, 
  u.last_action_date,
  CURRENT_DATE - u.last_action_date as days_inactive,
  bs.status as subscription_status
FROM users u
LEFT JOIN billing_customers bc ON bc.user_id = u.id
LEFT JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.email = 'mcddsl@icloud.com'
ORDER BY bs.created_at DESC
LIMIT 1;
-- Should show: days_inactive = 7, subscription_status = 'active' or 'trialing'
```

**Test Steps:**

1. **Set up user with 7 days inactive and active subscription** (run setup SQL above)

2. **Verify subscription status** - Check Stripe Dashboard or database

3. **Trigger streak recovery cron job:**

   ```bash
   curl -X GET "http://localhost:3000/api/cron/streak-recovery?secret=YOUR_CRON_SECRET"
   ```

4. **Check response:**

   ```json
   {
     "success": true,
     "day7BillingPauseOffers": 1,
     "day1PushNotifications": 0,
     "day2MicroModeDetected": 0,
     "day3EmailsSent": 0
   }
   ```

5. **Check email inbox** - Should receive email with:
   - Subject: "Pause your subscription while you're away"
   - Option to pause subscription
   - Link to settings page

6. **Verify metadata updated:**

   ```sql
   SELECT metadata->'streak_notifications' as notifications
   FROM users
   WHERE email = 'mcddsl@icloud.com';
   -- Should show: {"day7_sent": true, "last_day": 7, "last_notification_date": "2025-01-XX"}
   ```

**Expected Results:**

- ✅ Day 7 email sent only to users with active subscriptions
- ✅ Email received with billing pause offer
- ✅ Metadata updated with `day7_sent: true`
- ✅ Users without subscriptions don't receive email

---

## Test 5: No Active Subscription (Day 7 Skip)

**Goal:** Verify that Day 7 email is NOT sent to users without active subscriptions

**Setup SQL:**

```sql
-- Set up user with 7 days inactive but NO active subscription
WITH user_info AS (
  SELECT id as user_id
  FROM users
  WHERE email = 'mcddsl@icloud.com'
  LIMIT 1
)
UPDATE users
SET 
  streak_count = 0,
  last_action_date = CURRENT_DATE - INTERVAL '7 days',
  metadata = jsonb_build_object(
    'streak_notifications', jsonb_build_object()
  )
WHERE id = (SELECT user_id FROM user_info);

-- Verify no active subscription
SELECT 
  u.id, 
  u.email,
  bs.status as subscription_status
FROM users u
LEFT JOIN billing_customers bc ON bc.user_id = u.id
LEFT JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.email = 'mcddsl@icloud.com'
ORDER BY bs.created_at DESC
LIMIT 1;
-- Should show: subscription_status = NULL or 'canceled' or 'past_due'
```

**Test Steps:**

1. **Set up user with 7 days inactive but no active subscription** (run setup SQL above)

2. **Trigger streak recovery cron job:**

   ```bash
   curl -X GET "http://localhost:3000/api/cron/streak-recovery?secret=YOUR_CRON_SECRET"
   ```

3. **Check response:**

   ```json
   {
     "success": true,
     "day7BillingPauseOffers": 0,
     "processed": 1
   }
   ```

4. **Verify NO email sent** - Check inbox (should be empty)

**Expected Results:**

- ✅ Day 7 email NOT sent to users without active subscriptions
- ✅ Cron job logs skip message
- ✅ No errors in response

---

## Test 6: Notification Deduplication

**Goal:** Verify that notifications are not sent multiple times for the same day

**Setup SQL:**

```sql
-- Set up user with 3 days inactive and Day 3 notification already sent
WITH user_info AS (
  SELECT id as user_id
  FROM users
  WHERE email = 'mcddsl@icloud.com'
  LIMIT 1
)
UPDATE users
SET 
  streak_count = 0,
  last_action_date = CURRENT_DATE - INTERVAL '3 days',
  metadata = jsonb_build_object(
    'streak_notifications', jsonb_build_object(
      'day3_sent', true,
      'last_day', 3,
      'last_notification_date', CURRENT_DATE::text
    )
  )
WHERE id = (SELECT user_id FROM user_info);
```

**Test Steps:**

1. **Set up user with Day 3 notification already sent** (run setup SQL above)

2. **Trigger streak recovery cron job multiple times:**

   ```bash
   curl -X GET "http://localhost:3000/api/cron/streak-recovery?secret=YOUR_CRON_SECRET"
   curl -X GET "http://localhost:3000/api/cron/streak-recovery?secret=YOUR_CRON_SECRET"
   curl -X GET "http://localhost:3000/api/cron/streak-recovery?secret=YOUR_CRON_SECRET"
   ```

3. **Check response each time:**

   ```json
   {
     "success": true,
     "day3EmailsSent": 0  // Should be 0 every time
   }
   ```

4. **Verify only one email was sent** - Check Resend dashboard

**Expected Results:**

- ✅ No duplicate emails sent
- ✅ Cron job correctly detects already-sent notifications
- ✅ Metadata prevents duplicate sends

---

## Test 7: User Recovers (Streak Resets)

**Goal:** Verify that when user completes an action, streak notifications reset

**Setup SQL:**

```sql
-- Set up user with broken streak, then complete an action
WITH user_info AS (
  SELECT id as user_id
  FROM users
  WHERE email = 'mcddsl@icloud.com'
  LIMIT 1
)
-- Complete an action today (this should reset streak)
INSERT INTO actions (user_id, type, state, completed_at)
SELECT 
  (SELECT user_id FROM user_info),
  'FAST_WIN',
  'DONE',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM actions 
  WHERE user_id = (SELECT user_id FROM user_info)
    AND completed_at::DATE = CURRENT_DATE
    AND state IN ('DONE', 'REPLIED')
);

-- Update user streak (this should be done automatically, but verify)
SELECT update_user_streak((SELECT user_id FROM user_info));

-- Verify streak reset
SELECT 
  id, 
  email, 
  streak_count, 
  last_action_date
FROM users
WHERE email = 'mcddsl@icloud.com';
-- Should show: streak_count > 0, last_action_date = CURRENT_DATE
```

**Test Steps:**

1. **Set up user with broken streak** (use Test 3 setup)

2. **Complete an action** (run setup SQL above or mark action as done in UI)

3. **Trigger streak recovery cron job:**

   ```bash
   curl -X GET "http://localhost:3000/api/cron/streak-recovery?secret=YOUR_CRON_SECRET"
   ```

4. **Check response:**

   ```json
   {
     "success": true,
     "processed": 0  // User no longer has broken streak
   }
   ```

**Expected Results:**

- ✅ User with active streak is not processed
- ✅ No notifications sent
- ✅ Streak count updated correctly

---

## Test 8: Edge Cases

### Test 8.1: User Never Completed Action

**Setup:** User created account but never completed an action

**Expected:** User is skipped (daysInactive === null)

### Test 8.2: Multiple Days Inactive (Day 5)

**Setup:** User with 5 days inactive (between Day 3 and Day 7)

**Expected:** No notification sent (only Day 1, 2, 3, 7 are handled)

### Test 8.3: User Already Received Day 3, Now Day 7

**Setup:** User with Day 3 notification sent, now 7 days inactive

**Expected:** Day 7 notification sent (different day, so allowed)

---

## Test Checklist

```
Test Case | Status | Notes
----------|--------|------
5.1       | ⬜      | Day 1 detection and logging
5.2       | ⬜      | Day 2 Micro Mode activation
5.3       | ⬜      | Day 3 recovery email
5.4       | ⬜      | Day 7 billing pause offer (with subscription)
5.5       | ⬜      | Day 7 skip (no subscription)
5.6       | ⬜      | Notification deduplication
5.7       | ⬜      | User recovers (streak resets)
5.8.1     | ⬜      | Edge case: Never completed action
5.8.2     | ⬜      | Edge case: Day 5 (no notification)
5.8.3     | ⬜      | Edge case: Day 3 then Day 7
```

**Status Legend:**
- ⬜ Not tested
- ✅ Passed
- ❌ Failed
- ⚠️ Passed with issues

---

## Troubleshooting

### No users found with broken streaks

**Check:**
1. Verify `streak_count = 0` in database
2. Verify `last_action_date` is > 1 day ago
3. Check cron job query logic

### Email not received

**Check:**
1. Verify `RESEND_API_KEY` is set in environment
2. Check Resend dashboard for delivery status
3. Verify user email preferences (should not be unsubscribed)
4. Check spam folder

### Duplicate notifications

**Check:**
1. Verify metadata tracking is working
2. Check `last_notification_date` in metadata
3. Ensure cron job only runs once per day

### Micro Mode not activating

**Check:**
1. Verify `isInactive2To6Days` function returns true
2. Check plan generation logic for `adaptive_reason: "streak_break"`
3. Verify `capacity_level = "micro"` in generated plan

---

## Quick Test Checklist

- [ ] Test 5.1: Day 1 detection
- [ ] Test 5.2: Day 2 Micro Mode
- [ ] Test 5.3: Day 3 email
- [ ] Test 5.4: Day 7 billing pause (with subscription)
- [ ] Test 5.5: Day 7 skip (no subscription)
- [ ] Test 5.6: Deduplication
- [ ] Test 5.7: User recovery
- [ ] Test 5.8: Edge cases

---

## API Endpoints

### Streak Recovery Cron

**Endpoint:** `GET /api/cron/streak-recovery?secret=YOUR_CRON_SECRET`

**Response:**
```json
{
  "success": true,
  "message": "Streak recovery cron completed",
  "processed": 5,
  "day1PushNotifications": 1,
  "day2MicroModeDetected": 2,
  "day3EmailsSent": 1,
  "day7BillingPauseOffers": 1,
  "errors": [] // optional
}
```

### Test Email Endpoint

**Endpoint:** `GET /api/test-streak-email?email=test@example.com`

**Response:**
```json
{
  "success": true,
  "message": "Test streak recovery email sent",
  "emailId": "abc123",
  "to": "test@example.com",
  "userName": "Test User"
}
```

---

_Last updated: January 2025_

