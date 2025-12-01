-- Fix script for Test 3.2: Canceled Paywall
-- This ensures the user has a canceled subscription (past grace period)
-- Replace <your_test_user_id> with the actual user ID

-- Step 1: Get user ID (if you don't have it)
-- Uncomment and run this first to find the user ID:
-- SELECT id, email FROM users WHERE email = 'mcddsl+onboard3@gmail.com';

-- Step 2: Ensure billing customer exists
INSERT INTO billing_customers (user_id, stripe_customer_id, currency)
SELECT 
  '<your_test_user_id>'::UUID,
  'cus_test_' || gen_random_uuid()::TEXT,
  'usd'
WHERE NOT EXISTS (
  SELECT 1 FROM billing_customers WHERE user_id = '<your_test_user_id>'::UUID
);

-- Step 3: Get billing customer ID
DO $$
DECLARE
  v_customer_id UUID;
BEGIN
  SELECT id INTO v_customer_id
  FROM billing_customers
  WHERE user_id = '<your_test_user_id>'::UUID;
  
  -- Step 4: Ensure subscription exists and is canceled (past grace period)
  -- Set trial_ends_at to 10 days ago (past the 7-day grace period)
  INSERT INTO billing_subscriptions (
    billing_customer_id,
    stripe_subscription_id,
    stripe_price_id,
    status,
    current_period_end,
    trial_ends_at,
    cancel_at_period_end
  )
  VALUES (
    v_customer_id,
    'sub_test_' || gen_random_uuid()::TEXT,
    'price_test_standard_monthly',
    'canceled',
    NOW() - INTERVAL '5 days', -- Period ended 5 days ago
    NOW() - INTERVAL '10 days', -- Trial ended 10 days ago (past grace period)
    false
  )
  ON CONFLICT (stripe_subscription_id) DO UPDATE
  SET 
    status = 'canceled',
    trial_ends_at = NOW() - INTERVAL '10 days',
    current_period_end = NOW() - INTERVAL '5 days',
    cancel_at_period_end = false,
    updated_at = NOW();
  
  RAISE NOTICE 'Subscription set to canceled (past grace period)';
  RAISE NOTICE 'trial_ends_at: %', NOW() - INTERVAL '10 days';
  RAISE NOTICE 'Days since trial ended: 10 (past 7-day grace period)';
END $$;

-- Step 5: Verify the setup
SELECT 
  u.email,
  bs.status,
  bs.trial_ends_at,
  bs.current_period_end,
  EXTRACT(DAY FROM (NOW() - bs.trial_ends_at))::INTEGER as days_since_trial_ended,
  CASE 
    WHEN bs.trial_ends_at <= NOW() - INTERVAL '7 days' THEN 'Past grace period - should show canceled paywall'
    WHEN bs.trial_ends_at <= NOW() AND bs.trial_ends_at > NOW() - INTERVAL '7 days' THEN 'In grace period - will show grace period paywall'
    ELSE 'Trial not ended'
  END as expected_paywall_type
FROM billing_subscriptions bs
JOIN billing_customers bc ON bs.billing_customer_id = bc.id
JOIN users u ON bc.user_id = u.id
WHERE u.id = '<your_test_user_id>'::UUID;

