-- Create Premium User
-- Use this to set up a user with an active Premium subscription
-- Replace '<user_email>' with your test user email

-- Step 1: Get user ID
SELECT id as user_id, email 
FROM users 
WHERE email = '<user_email>';

-- Step 2: Create billing customer (replace USER_ID)
INSERT INTO billing_customers (user_id, stripe_customer_id, currency)
VALUES ('<USER_ID>'::uuid, 'cus_test_premium', 'usd')
ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = 'cus_test_premium';

-- Step 3: Create premium subscription (replace USER_ID and adjust price_id)
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
  'sub_test_premium',
  'price_1ScDJWIrhm12Lbxf2alCQakP',  -- Replace with actual Premium price ID
  'active',
  NOW() + INTERVAL '1 month',
  NULL,  -- No trial for active subscription
  '{"plan_name": "Premium", "plan_type": "premium", "interval": "month"}'::jsonb
FROM billing_customers bc
WHERE bc.user_id = '<USER_ID>'::uuid
ON CONFLICT (stripe_subscription_id) DO UPDATE
SET status = 'active',
    current_period_end = NOW() + INTERVAL '1 month',
    metadata = '{"plan_name": "Premium", "plan_type": "premium", "interval": "month"}'::jsonb;

-- Step 4: Verify premium subscription
SELECT 
  u.email,
  bs.status,
  bs.metadata->>'plan_type' as plan_type,
  bs.metadata->>'plan_name' as plan_name,
  bs.current_period_end
FROM users u
JOIN billing_customers bc ON bc.user_id = u.id
JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.email = '<user_email>'
ORDER BY bs.created_at DESC
LIMIT 1;

