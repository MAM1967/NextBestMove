# Group 3 Complete Testing Guide - User Experience & Engagement

**Date:** January 2025  
**Status:** 📋 Ready for Testing  
**Features:**

1. Adaptive Recovery & Celebration Flows (low completion, 7+ day inactivity, high streaks)
2. Streak Break Detection & Recovery (Day 1-3 notifications, Day 3 email, Day 7 billing pause)

---

## Prerequisites

1. **Test User Account** - You'll need at least one test user account
2. **Supabase Access** - To run SQL scripts for test data setup
3. **Email Access** - To verify streak recovery emails
4. **Browser Console** - Open DevTools to check for errors
5. **CRON_SECRET** or **CRON_JOB_ORG_API_KEY** - For testing cron endpoints
6. **Daily Plans** - User should have some daily plans with actions

---

## Step 1: Set Up Test User

First, identify your test user ID and email. You can find it in Supabase:

```sql
-- Find your test user
SELECT id, email, name, streak_count, last_action_date
FROM users
WHERE email = 'your-test-email@example.com';
```

**Note:** Replace `'your-test-email@example.com'` with your actual test user email.

---

## Scenario 1: Adaptive Recovery - Low Completion Pattern

### Test 1.1: Low Completion Pattern Detection (3+ days < 50%)

**Goal:** Verify that users with low completion rates get lighter plans

**Setup SQL:**

```sql
-- Set up user with low completion pattern
-- First, get user ID
-- Replace 'your-test-email@example.com' with your test email
WITH user_info AS (
  SELECT id as user_id
  FROM users
  WHERE email = 'your-test-email@example.com'
  LIMIT 1
)
-- Create daily plans for last 3 days with low completion
INSERT INTO daily_plans (user_id, date, capacity, free_minutes)
SELECT 
  user_id,
  CURRENT_DATE - INTERVAL '3 days' as date,
  'standard' as capacity,
  90 as free_minutes
FROM user_info
ON CONFLICT (user_id, date) DO NOTHING;

-- Create plan actions but mark most as incomplete
-- This simulates low completion
WITH user_info AS (
  SELECT id as user_id
  FROM users
  WHERE email = 'your-test-email@example.com'
  LIMIT 1
),
plan_info AS (
  SELECT id as plan_id
  FROM daily_plans
  WHERE user_id = (SELECT user_id FROM user_info)
    AND date = CURRENT_DATE - INTERVAL '3 days'
  LIMIT 1
),
actions AS (
  SELECT id as action_id
  FROM actions
  WHERE user_id = (SELECT user_id FROM user_info)
    AND state IN ('NEW', 'SNOOZED')
  LIMIT 6
)
INSERT INTO daily_plan_actions (daily_plan_id, action_id, position, is_fast_win)
SELECT 
  plan_id,
  action_id,
  row_number() OVER () - 1 as position,
  CASE WHEN row_number() OVER () = 1 THEN true ELSE false END as is_fast_win
FROM plan_info, actions
LIMIT 6
ON CONFLICT DO NOTHING;

-- Mark only 1 out of 6 actions as completed (16% completion)
WITH user_info AS (
  SELECT id as user_id
  FROM users
  WHERE email = 'your-test-email@example.com'
  LIMIT 1
),
plan_info AS (
  SELECT id as plan_id
  FROM daily_plans
  WHERE user_id = (SELECT user_id FROM user_info)
    AND date = CURRENT_DATE - INTERVAL '3 days'
  LIMIT 1
),
plan_actions AS (
  SELECT action_id
  FROM daily_plan_actions
  WHERE daily_plan_id = (SELECT plan_id FROM plan_info)
  ORDER BY position
  LIMIT 1
)
UPDATE actions
SET state = 'DONE',
    completed_at = (CURRENT_DATE - INTERVAL '3 days')::timestamp + INTERVAL '10 hours'
WHERE id IN (SELECT action_id FROM plan_actions);

-- Repeat for 2 more days (simulate 3 days of low completion)
-- Day 2
WITH user_info AS (
  SELECT id as user_id
  FROM users
  WHERE email = 'your-test-email@example.com'
  LIMIT 1
)
INSERT INTO daily_plans (user_id, date, capacity, free_minutes)
SELECT 
  user_id,
  CURRENT_DATE - INTERVAL '2 days' as date,
  'standard' as capacity,
  90 as free_minutes
FROM user_info
ON CONFLICT (user_id, date) DO NOTHING;

-- Day 1
WITH user_info AS (
  SELECT id as user_id
  FROM users
  WHERE email = 'your-test-email@example.com'
  LIMIT 1
)
INSERT INTO daily_plans (user_id, date, capacity, free_minutes)
SELECT 
  user_id,
  CURRENT_DATE - INTERVAL '1 day' as date,
  'standard' as capacity,
  90 as free_minutes
FROM user_info
ON CONFLICT (user_id, date) DO NOTHING;
```

**Test Steps:**

1. Generate a new daily plan for today
2. Check the plan capacity - should be `light` (3 actions) instead of `standard` (6 actions)
3. Check the focus statement - should say "Let's ease back in — here are your highest-impact moves for today."
4. Verify only 3 actions are in the plan

**Expected Result:**
- Plan capacity: `light`
- Action count: 3 (instead of 6)
- Focus statement includes easing message

---

### Test 1.2: 7+ Day Inactivity - Comeback Plan

**Goal:** Verify that users inactive for 7+ days get a micro plan with comeback message

**Setup SQL:**

```sql
-- Set user to 7+ days inactive
UPDATE users
SET last_action_date = CURRENT_DATE - INTERVAL '8 days',
    streak_count = 0
WHERE email = 'your-test-email@example.com';
```

**Test Steps:**

1. Generate a new daily plan for today
2. Check the plan capacity - should be `micro` (2 actions)
3. Check the focus statement - should say "Welcome back. One small win to restart your momentum."
4. Verify only 2 actions are in the plan

**Expected Result:**
- Plan capacity: `micro`
- Action count: 2 (instead of 6)
- Focus statement includes comeback message

---

### Test 1.3: High Completion Streak - Boost to Heavy

**Goal:** Verify that users with 7+ days > 80% completion get boosted to heavy plan

**Setup SQL:**

```sql
-- Set up user with high completion streak
-- Create daily plans for last 7 days with high completion
WITH user_info AS (
  SELECT id as user_id
  FROM users
  WHERE email = 'your-test-email@example.com'
  LIMIT 1
)
-- Create plans for last 7 days
INSERT INTO daily_plans (user_id, date, capacity, free_minutes)
SELECT 
  user_id,
  CURRENT_DATE - (7 - generate_series(0, 6)) as date,
  'standard' as capacity,
  90 as free_minutes
FROM user_info
ON CONFLICT (user_id, date) DO NOTHING;

-- Mark all actions as completed for each plan (100% completion)
-- This is a simplified version - you may need to create actual actions
WITH user_info AS (
  SELECT id as user_id
  FROM users
  WHERE email = 'your-test-email@example.com'
  LIMIT 1
),
plans AS (
  SELECT id as plan_id, date
  FROM daily_plans
  WHERE user_id = (SELECT user_id FROM user_info)
    AND date >= CURRENT_DATE - INTERVAL '7 days'
),
actions AS (
  SELECT id as action_id
  FROM actions
  WHERE user_id = (SELECT user_id FROM user_info)
    AND state IN ('DONE', 'REPLIED', 'SENT')
  LIMIT 50
)
-- Mark actions as completed on their respective plan dates
UPDATE actions
SET completed_at = (
  SELECT date FROM plans 
  WHERE plan_id IN (
    SELECT daily_plan_id 
    FROM daily_plan_actions 
    WHERE action_id = actions.id
  )
  LIMIT 1
)::timestamp + INTERVAL '10 hours',
state = 'DONE'
WHERE id IN (
  SELECT action_id FROM daily_plan_actions
  WHERE daily_plan_id IN (SELECT plan_id FROM plans)
)
AND state IN ('NEW', 'SNOOZED');
```

**Test Steps:**

1. Generate a new daily plan for today
2. Check the plan capacity - should be `heavy` (8 actions) if user normally gets `standard`
3. Check the focus statement - should say "You're on a roll! Here's your plan for today."
4. Verify 8 actions are in the plan

**Expected Result:**
- Plan capacity: `heavy` (boosted from standard)
- Action count: 8
- Focus statement includes celebration message

---

## Scenario 2: Celebration Banner

### Test 2.1: High Completion Streak Banner

**Goal:** Verify celebration banner appears for users with 7+ day completion streaks

**Setup SQL:**

```sql
-- Use the same setup as Test 1.3 (high completion streak)
-- Ensure user has 7+ days of > 80% completion
```

**Test Steps:**

1. Navigate to `/app/plan` page
2. Check if celebration banner appears at the top
3. Banner should say "You're on a roll!" with message about 7 days straight
4. Banner should be dismissible (click X to close)

**Expected Result:**
- Celebration banner visible
- Shows correct message about 7-day streak
- Can be dismissed

---

## Scenario 3: Streak Break Detection & Recovery

### Test 3.1: Streak Break Detection (Day 3 Email)

**Goal:** Verify streak recovery email is sent on Day 3 after streak break

**Setup SQL:**

```sql
-- Set user to Day 3 after streak break
UPDATE users
SET streak_count = 0,
    last_action_date = CURRENT_DATE - INTERVAL '3 days'
WHERE email = 'your-test-email@example.com';
```

**Test Steps:**

1. Run the streak recovery cron job manually:
   ```bash
   curl "https://nextbestmove.app/api/cron/streak-recovery?secret=YOUR_CRON_SECRET"
   ```
   Or with Authorization header:
   ```bash
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://nextbestmove.app/api/cron/streak-recovery
   ```

2. Check the response - should show `day3EmailsSent: 1`
3. Check email inbox - should receive streak recovery email
4. Email should have subject: "Let's get your streak back on track"
5. Email should include link to comeback plan

**Expected Result:**
- Cron job returns success with `day3EmailsSent: 1`
- Email received within a few minutes
- Email content is encouraging and includes comeback plan link

---

### Test 3.2: Day 2 Micro Mode Auto-Enable

**Goal:** Verify Micro Mode is automatically enabled on Day 2 of streak break

**Setup SQL:**

```sql
-- Set user to Day 2 after streak break
UPDATE users
SET streak_count = 0,
    last_action_date = CURRENT_DATE - INTERVAL '2 days'
WHERE email = 'your-test-email@example.com';
```

**Test Steps:**

1. Generate a new daily plan for today
2. Check the plan capacity - should be `micro` (2 actions) due to adaptive recovery
3. Check the focus statement - should include comeback message

**Expected Result:**
- Plan capacity: `micro` (2 actions)
- Focus statement includes comeback message
- Plan is lighter to help user ease back in

---

### Test 3.3: Day 7 Billing Pause Offer (Future)

**Goal:** Verify Day 7 billing pause offer is logged (not yet implemented)

**Setup SQL:**

```sql
-- Set user to Day 7 after streak break
UPDATE users
SET streak_count = 0,
    last_action_date = CURRENT_DATE - INTERVAL '7 days'
WHERE email = 'your-test-email@example.com';
```

**Test Steps:**

1. Run the streak recovery cron job manually
2. Check the response - should show `day7BillingPauseOffers: 1`
3. Check logs - should log billing pause offer (not yet implemented)

**Expected Result:**
- Cron job returns success with `day7BillingPauseOffers: 1`
- Logs show billing pause offer (implementation pending)

---

## Quick Test Checklist

Use this checklist for quick verification:

- [ ] **Low Completion Pattern:**
  - [ ] User with 3+ days < 50% completion gets `light` plan (3 actions)
  - [ ] Focus statement includes easing message

- [ ] **7+ Day Inactivity:**
  - [ ] User inactive 7+ days gets `micro` plan (2 actions)
  - [ ] Focus statement includes comeback message

- [ ] **High Completion Streak:**
  - [ ] User with 7+ days > 80% completion gets `heavy` plan (8 actions)
  - [ ] Focus statement includes celebration message
  - [ ] Celebration banner appears on plan page

- [ ] **Streak Break Recovery:**
  - [ ] Day 2: Micro Mode auto-enabled (via plan generation)
  - [ ] Day 3: Recovery email sent via cron job
  - [ ] Day 7: Billing pause offer logged (not yet implemented)

---

## Troubleshooting

### Plan Not Adapting

**Issue:** Plan generation not using adaptive recovery logic

**Check:**
1. Verify completion tracking functions are working:
   ```sql
   -- Check completion history
   SELECT date, 
     (SELECT COUNT(*) FROM daily_plan_actions dpa 
      JOIN actions a ON dpa.action_id = a.id 
      WHERE dpa.daily_plan_id = dp.id 
        AND a.state IN ('DONE', 'REPLIED', 'SENT'))::float / 
     NULLIF((SELECT COUNT(*) FROM daily_plan_actions WHERE daily_plan_id = dp.id), 0) * 100 as completion_rate
   FROM daily_plans dp
   WHERE user_id = 'your-user-id'
   ORDER BY date DESC
   LIMIT 7;
   ```

2. Check if adaptive recovery logic is being called in plan generation
3. Verify `last_action_date` is set correctly in users table

### Celebration Banner Not Showing

**Issue:** Banner doesn't appear even with high completion streak

**Check:**
1. Verify user has 7+ days of plans with > 80% completion
2. Check browser console for errors
3. Verify `hasHighCompletionStreak()` function is working
4. Check if banner component is imported in plan page

### Streak Recovery Email Not Sending

**Issue:** Cron job runs but email not received

**Check:**
1. Verify cron job returns success with `day3EmailsSent: 1`
2. Check Resend API logs for email delivery
3. Verify user email is correct in database
4. Check spam folder
5. Verify `RESEND_API_KEY` is set in Vercel

---

## SQL Helper Scripts

### Check User Completion History

```sql
-- View completion history for a user
WITH user_info AS (
  SELECT id as user_id
  FROM users
  WHERE email = 'your-test-email@example.com'
  LIMIT 1
)
SELECT 
  dp.date,
  dp.capacity,
  COUNT(dpa.action_id) as total_actions,
  COUNT(CASE WHEN a.state IN ('DONE', 'REPLIED', 'SENT') THEN 1 END) as completed_actions,
  ROUND(
    COUNT(CASE WHEN a.state IN ('DONE', 'REPLIED', 'SENT') THEN 1 END)::float / 
    NULLIF(COUNT(dpa.action_id), 0) * 100, 
    1
  ) as completion_rate
FROM daily_plans dp
LEFT JOIN daily_plan_actions dpa ON dp.id = dpa.daily_plan_id
LEFT JOIN actions a ON dpa.action_id = a.id
WHERE dp.user_id = (SELECT user_id FROM user_info)
  AND dp.date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY dp.id, dp.date, dp.capacity
ORDER BY dp.date DESC;
```

### Check User Streak Status

```sql
-- Check user streak and last action date
SELECT 
  id,
  email,
  streak_count,
  last_action_date,
  CURRENT_DATE - last_action_date::date as days_since_last_action,
  CASE 
    WHEN streak_count = 0 AND last_action_date < CURRENT_DATE - INTERVAL '1 day' 
    THEN 'Streak broken'
    ELSE 'Streak active'
  END as streak_status
FROM users
WHERE email = 'your-test-email@example.com';
```

### Reset User for Testing

```sql
-- Reset user to clean state for testing
UPDATE users
SET streak_count = 0,
    last_action_date = NULL
WHERE email = 'your-test-email@example.com';

-- Delete recent plans to start fresh
DELETE FROM daily_plans
WHERE user_id = (SELECT id FROM users WHERE email = 'your-test-email@example.com')
  AND date >= CURRENT_DATE - INTERVAL '7 days';
```

---

## Next Steps After Testing

1. **If all tests pass:** Mark Group 3 as complete in backlog
2. **If issues found:** Document bugs and create fixes
3. **Performance check:** Verify plan generation time with adaptive logic
4. **Email deliverability:** Monitor Resend logs for streak recovery emails

---

_Last updated: January 2025_

