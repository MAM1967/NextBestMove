-- Create premium subscription for a specific user by email
-- Replace 'your-email@example.com' with the actual email address

DO $$
DECLARE
  target_user_id UUID;
  customer_id UUID;
  subscription_id UUID;
BEGIN
  -- Find user by email (replace with your email)
  SELECT id INTO target_user_id 
  FROM users 
  WHERE email = 'mcddsl+test1@gmail.com'; -- CHANGE THIS EMAIL
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: mcddsl+test1@gmail.com';
  END IF;
  
  RAISE NOTICE 'Found user: %', target_user_id;
  
  -- Create or get billing customer
  INSERT INTO billing_customers (user_id, stripe_customer_id, currency)
  VALUES (target_user_id, 'cus_test_' || gen_random_uuid()::text, 'usd')
  ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
  RETURNING id INTO customer_id;
  
  -- Get customer ID if it already existed
  IF customer_id IS NULL THEN
    SELECT id INTO customer_id FROM billing_customers WHERE user_id = target_user_id;
  END IF;
  
  RAISE NOTICE 'Customer ID: %', customer_id;
  
  -- Delete any existing test subscriptions for this customer
  DELETE FROM billing_subscriptions 
  WHERE billing_customer_id = customer_id 
    AND stripe_subscription_id LIKE 'sub_test_%';
  
  -- Create professional subscription
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
    'sub_test_' || gen_random_uuid()::text,
    'price_test_professional', -- Placeholder, not used for testing
    'active',
    NOW() + INTERVAL '30 days',
    false,
    jsonb_build_object(
      'plan_name', 'Premium',
      'plan_type', 'premium',
      'interval', 'month'
    )
  )
  RETURNING id INTO subscription_id;
  
  RAISE NOTICE 'Subscription created: %', subscription_id;
  RAISE NOTICE 'Premium subscription setup complete!';
END $$;

-- Verify the subscription
SELECT 
  u.email,
  u.id as user_id,
  bc.id as customer_id,
  bs.id as subscription_id,
  bs.status,
  bs.metadata->>'plan_type' as plan_type,
  bs.metadata->>'plan_name' as plan_name,
  bs.current_period_end
FROM users u
JOIN billing_customers bc ON bc.user_id = u.id
JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.email = 'mcddsl+test1@gmail.com' -- CHANGE THIS EMAIL
  AND bs.status IN ('active', 'trialing')
ORDER BY bs.created_at DESC;

