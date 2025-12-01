-- Fix Day 21 Grace Period for User: cea4b2e8-462f-48bc-a397-5cf92bf3b335
-- Set to 6.9 days ago to ensure it's still in grace period (avoiding boundary condition)

-- Step 1: Check current state
SELECT 
  'Current State' as step,
  u.email,
  bc.id as billing_customer_id,
  bs.status,
  bs.trial_ends_at,
  NOW() - bs.trial_ends_at as days_since_trial_ended,
  (bs.trial_ends_at + INTERVAL '7 days') - NOW() as days_remaining_in_grace
FROM users u
LEFT JOIN billing_customers bc ON bc.user_id = u.id
LEFT JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.id = 'cea4b2e8-462f-48bc-a397-5cf92bf3b335'
ORDER BY bs.created_at DESC
LIMIT 1;

-- Step 2: Ensure billing_customer exists
INSERT INTO billing_customers (user_id, stripe_customer_id, currency)
VALUES ('cea4b2e8-462f-48bc-a397-5cf92bf3b335', 'cus_test_day21_' || substr('cea4b2e8-462f-48bc-a397-5cf92bf3b335', 1, 8), 'usd')
ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW();

-- Step 3: Set to Day 21 (6.9 days ago - still in grace period, but very close to end)
-- Using 6 days 21 hours = 6.875 days to ensure we're still within the 7-day window
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
  'sub_test_day21_' || substr('cea4b2e8-462f-48bc-a397-5cf92bf3b335', 1, 8),
  'price_test',
  'canceled',
  NOW() - INTERVAL '6 days 21 hours',
  NOW() - INTERVAL '6 days 21 hours',  -- Trial ended 6.875 days ago (Day 21 - very close to end)
  '{"plan_name": "Standard", "plan_type": "standard", "interval": "month"}'::jsonb
FROM billing_customers bc
WHERE bc.user_id = 'cea4b2e8-462f-48bc-a397-5cf92bf3b335'
ON CONFLICT (stripe_subscription_id) DO UPDATE
SET 
  trial_ends_at = NOW() - INTERVAL '6 days 21 hours',
  status = 'canceled',
  current_period_end = NOW() - INTERVAL '6 days 21 hours',
  updated_at = NOW();

-- Step 4: Verify the fix
SELECT 
  'Verification' as step,
  bs.status,
  bs.trial_ends_at,
  EXTRACT(EPOCH FROM (NOW() - bs.trial_ends_at)) / 86400 as days_since_trial_ended,
  EXTRACT(EPOCH FROM ((bs.trial_ends_at + INTERVAL '7 days') - NOW())) / 86400 as days_remaining_in_grace,
  CEIL(EXTRACT(EPOCH FROM ((bs.trial_ends_at + INTERVAL '7 days') - NOW())) / 86400) as days_remaining_rounded,
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
  WHERE user_id = 'cea4b2e8-462f-48bc-a397-5cf92bf3b335'
)
ORDER BY bs.created_at DESC
LIMIT 1;

