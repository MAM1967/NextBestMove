-- Debug Grace Period Banner Issue
-- User ID: dacf6268-aeb3-47ce-b503-6ba8f934533b

-- Step 1: Check if billing_customer exists
SELECT 
  'Billing Customer Check' as check_type,
  bc.id as billing_customer_id,
  bc.user_id,
  bc.stripe_customer_id
FROM billing_customers bc
WHERE bc.user_id = 'dacf6268-aeb3-47ce-b503-6ba8f934533b';

-- Step 2: Check subscription status and trial_ends_at
SELECT 
  'Subscription Check' as check_type,
  bs.id,
  bs.status,
  bs.trial_ends_at,
  bs.current_period_end,
  bs.created_at,
  -- Calculate grace period status
  CASE 
    WHEN bs.trial_ends_at IS NULL THEN 'No trial date'
    WHEN bs.trial_ends_at > NOW() THEN CONCAT('Trial still active - ends in ', CEIL(EXTRACT(EPOCH FROM (bs.trial_ends_at - NOW())) / 86400), ' days')
    WHEN bs.trial_ends_at > NOW() - INTERVAL '7 days' THEN CONCAT('IN GRACE PERIOD - ', CEIL(EXTRACT(EPOCH FROM (NOW() - bs.trial_ends_at)) / 86400), ' days since trial ended, ', CEIL(EXTRACT(EPOCH FROM ((bs.trial_ends_at + INTERVAL '7 days') - NOW())) / 86400), ' days remaining')
    ELSE 'Past grace period'
  END as grace_period_status,
  -- Check if should show banner
  CASE 
    WHEN bs.status = 'canceled' AND bs.trial_ends_at IS NOT NULL AND bs.trial_ends_at <= NOW() AND bs.trial_ends_at > NOW() - INTERVAL '7 days' THEN 'SHOULD SHOW BANNER ✅'
    WHEN bs.status = 'canceled' AND bs.trial_ends_at IS NULL THEN 'Missing trial_ends_at ❌'
    WHEN bs.status != 'canceled' THEN CONCAT('Status is "', bs.status, '" - should be "canceled" ❌')
    WHEN bs.trial_ends_at > NOW() THEN 'Trial not ended yet ❌'
    WHEN bs.trial_ends_at <= NOW() - INTERVAL '7 days' THEN 'Past grace period ❌'
    ELSE 'Unknown issue ❌'
  END as banner_status
FROM billing_subscriptions bs
WHERE bs.billing_customer_id = (
  SELECT id FROM billing_customers 
  WHERE user_id = 'dacf6268-aeb3-47ce-b503-6ba8f934533b'
)
ORDER BY bs.created_at DESC
LIMIT 1;

-- Step 3: Fix if needed - Set to Day 17 (3 days into grace period)
-- Uncomment and run this if subscription doesn't exist or is wrong:
/*
UPDATE billing_subscriptions 
SET trial_ends_at = NOW() - INTERVAL '3 days',
    status = 'canceled'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers 
  WHERE user_id = 'dacf6268-aeb3-47ce-b503-6ba8f934533b'
);
*/

-- Step 4: If no billing_customer exists, create one first:
/*
INSERT INTO billing_customers (user_id, stripe_customer_id, currency)
VALUES ('dacf6268-aeb3-47ce-b503-6ba8f934533b', 'cus_test_grace_period', 'usd')
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
  'sub_test_grace_period',
  'price_test',
  'canceled',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days',
  '{"plan_name": "Standard", "plan_type": "standard", "interval": "month"}'::jsonb
FROM billing_customers bc
WHERE bc.user_id = 'dacf6268-aeb3-47ce-b503-6ba8f934533b'
ON CONFLICT (stripe_subscription_id) DO UPDATE
SET trial_ends_at = NOW() - INTERVAL '3 days',
    status = 'canceled',
    current_period_end = NOW() - INTERVAL '3 days';
*/

