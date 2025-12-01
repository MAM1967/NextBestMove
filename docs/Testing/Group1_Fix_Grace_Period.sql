-- Fix Grace Period Banner for User: dacf6268-aeb3-47ce-b503-6ba8f934533b
-- Run this in Supabase SQL Editor

-- Step 1: Check current state
SELECT 
  'Current State' as step,
  u.email,
  bc.id as billing_customer_id,
  bs.id as subscription_id,
  bs.status,
  bs.trial_ends_at,
  CASE 
    WHEN bs.trial_ends_at IS NULL THEN 'No trial date'
    WHEN bs.trial_ends_at > NOW() THEN CONCAT('Trial active - ends in ', CEIL(EXTRACT(EPOCH FROM (bs.trial_ends_at - NOW())) / 86400), ' days')
    WHEN bs.trial_ends_at > NOW() - INTERVAL '7 days' THEN CONCAT('IN GRACE PERIOD - ', CEIL(EXTRACT(EPOCH FROM (NOW() - bs.trial_ends_at)) / 86400), ' days since trial ended')
    ELSE 'Past grace period'
  END as grace_period_status
FROM users u
LEFT JOIN billing_customers bc ON bc.user_id = u.id
LEFT JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.id = 'dacf6268-aeb3-47ce-b503-6ba8f934533b'
ORDER BY bs.created_at DESC
LIMIT 1;

-- Step 2: Ensure billing_customer exists
INSERT INTO billing_customers (user_id, stripe_customer_id, currency)
VALUES ('dacf6268-aeb3-47ce-b503-6ba8f934533b', 'cus_test_grace_' || substr('dacf6268-aeb3-47ce-b503-6ba8f934533b', 1, 8), 'usd')
ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
RETURNING id as billing_customer_id;

-- Step 3: Create or update subscription to Day 17 (3 days into grace period)
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
  'sub_test_grace_' || substr('dacf6268-aeb3-47ce-b503-6ba8f934533b', 1, 8),
  'price_test',
  'canceled',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days',  -- Trial ended 3 days ago (Day 17)
  '{"plan_name": "Standard", "plan_type": "standard", "interval": "month"}'::jsonb
FROM billing_customers bc
WHERE bc.user_id = 'dacf6268-aeb3-47ce-b503-6ba8f934533b'
ON CONFLICT (stripe_subscription_id) DO UPDATE
SET 
  trial_ends_at = NOW() - INTERVAL '3 days',
  status = 'canceled',
  current_period_end = NOW() - INTERVAL '3 days',
  updated_at = NOW()
RETURNING 
  id,
  status,
  trial_ends_at,
  'Banner should show: 4 days remaining' as expected_result;

-- Step 4: Verify the fix
SELECT 
  'Verification' as step,
  bs.status,
  bs.trial_ends_at,
  NOW() - bs.trial_ends_at as days_since_trial_ended,
  (bs.trial_ends_at + INTERVAL '7 days') - NOW() as days_remaining_in_grace,
  CASE 
    WHEN bs.status = 'canceled' 
     AND bs.trial_ends_at IS NOT NULL 
     AND bs.trial_ends_at <= NOW() 
     AND bs.trial_ends_at > NOW() - INTERVAL '7 days' 
    THEN '✅ BANNER SHOULD SHOW'
    ELSE '❌ BANNER WILL NOT SHOW'
  END as banner_status
FROM billing_subscriptions bs
WHERE bs.billing_customer_id = (
  SELECT id FROM billing_customers 
  WHERE user_id = 'dacf6268-aeb3-47ce-b503-6ba8f934533b'
)
ORDER BY bs.created_at DESC
LIMIT 1;

