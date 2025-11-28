-- Helper script to create a test premium subscription
-- Run this in Supabase SQL Editor after identifying your test user
-- 
-- Usage:
-- 1. Find your user ID: SELECT id, email FROM users WHERE email = 'your-email@example.com';
-- 2. Replace 'YOUR_USER_ID_HERE' with the actual UUID
-- 3. Run this script

-- Example: Create premium subscription for a test user
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID

DO $$
DECLARE
  test_user_id UUID;
  customer_id UUID;
  subscription_id UUID;
BEGIN
  -- Get the first user (or change this to a specific email)
  SELECT id INTO test_user_id 
  FROM users 
  LIMIT 1;
  
  -- If no user found, you can manually set it:
  -- test_user_id := 'YOUR_USER_ID_HERE'::UUID;
  
  IF test_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found. Please create a user first or set test_user_id manually.';
  END IF;
  
  -- Create billing customer if it doesn't exist
  INSERT INTO billing_customers (user_id, stripe_customer_id, currency)
  VALUES (test_user_id, 'cus_test_premium_' || gen_random_uuid()::text, 'usd')
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO customer_id;
  
  -- Get customer ID if it already exists
  IF customer_id IS NULL THEN
    SELECT id INTO customer_id FROM billing_customers WHERE user_id = test_user_id;
  END IF;
  
  -- Create professional subscription (active status)
  INSERT INTO billing_subscriptions (
    billing_customer_id,
    stripe_subscription_id,
    stripe_price_id,
    status,
    current_period_end,
    cancel_at_period_end,
    metadata
  )
  VALUES (
    customer_id,
    'sub_test_premium_' || gen_random_uuid()::text,
    'price_test_professional_monthly', -- This is just a placeholder
    'active',
    NOW() + INTERVAL '30 days',
    false,
    jsonb_build_object(
      'plan_name', 'Professional',
      'plan_type', 'professional',
      'interval', 'month'
    )
  )
  ON CONFLICT (stripe_subscription_id) DO UPDATE
  SET 
    status = 'active',
    metadata = jsonb_build_object(
      'plan_name', 'Professional',
      'plan_type', 'professional',
      'interval', 'month'
    );
  
  RAISE NOTICE 'Premium subscription created for user: %', test_user_id;
  RAISE NOTICE 'Customer ID: %', customer_id;
END $$;

-- Verify the subscription was created
SELECT 
  u.email,
  u.id as user_id,
  bc.id as customer_id,
  bs.id as subscription_id,
  bs.status,
  bs.metadata->>'plan_type' as plan_type,
  bs.metadata->>'plan_name' as plan_name
FROM users u
LEFT JOIN billing_customers bc ON bc.user_id = u.id
LEFT JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE bs.status IN ('active', 'trialing')
ORDER BY bs.created_at DESC
LIMIT 5;

