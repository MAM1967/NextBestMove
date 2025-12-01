-- Diagnostic script for Test 3.2: Canceled Paywall
-- Replace <your_test_user_id> with the actual user ID (e.g., from mcddsl+onboard3@gmail.com)

-- Step 1: Find user ID by email
SELECT 
  id as user_id,
  email,
  name,
  created_at
FROM users
WHERE email = 'mcddsl+onboard3@gmail.com';

-- Step 2: Check billing customer
SELECT 
  bc.id as billing_customer_id,
  bc.user_id,
  bc.stripe_customer_id,
  bc.created_at
FROM billing_customers bc
WHERE bc.user_id = '<your_test_user_id>';

-- Step 3: Check subscription status
SELECT 
  bs.id,
  bs.billing_customer_id,
  bs.stripe_subscription_id,
  bs.status,
  bs.trial_ends_at,
  bs.current_period_end,
  bs.cancel_at_period_end,
  bs.created_at,
  bs.updated_at,
  -- Calculate grace period status
  CASE 
    WHEN bs.trial_ends_at IS NULL THEN 'No trial end date'
    WHEN bs.trial_ends_at > NOW() THEN 'Trial not ended yet'
    WHEN bs.trial_ends_at <= NOW() AND bs.trial_ends_at > NOW() - INTERVAL '7 days' THEN 'In grace period (Day 15-21)'
    WHEN bs.trial_ends_at <= NOW() - INTERVAL '7 days' THEN 'Past grace period (should show canceled)'
    ELSE 'Unknown'
  END as grace_period_status,
  -- Days since trial ended
  CASE 
    WHEN bs.trial_ends_at IS NULL THEN NULL
    ELSE EXTRACT(DAY FROM (NOW() - bs.trial_ends_at))::INTEGER
  END as days_since_trial_ended
FROM billing_subscriptions bs
WHERE bs.billing_customer_id = (
  SELECT id FROM billing_customers WHERE user_id = '<your_test_user_id>'
)
ORDER BY bs.created_at DESC;

-- Step 4: Expected values for Test 3.2 (Canceled - past grace period)
-- Status should be: 'canceled'
-- trial_ends_at should be: More than 7 days ago (e.g., NOW() - INTERVAL '10 days')
-- This ensures effectiveStatus = "canceled" (not "grace_period")

