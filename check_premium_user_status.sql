-- Check Premium user status for mcddsl@icloud.com
-- This helps diagnose why the user isn't recognized as Premium

-- Step 1: Check if user exists
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as user_created_at
FROM users u
WHERE u.email = 'mcddsl@icloud.com';

-- Step 2: Check billing customer
SELECT 
  bc.id as customer_id,
  bc.stripe_customer_id,
  bc.user_id,
  bc.created_at as customer_created_at
FROM billing_customers bc
JOIN users u ON u.id = bc.user_id
WHERE u.email = 'mcddsl@icloud.com';

-- Step 3: Check all subscriptions (active and inactive)
SELECT 
  bs.id as subscription_id,
  bs.stripe_subscription_id,
  bs.stripe_price_id,
  bs.status,
  bs.metadata->>'plan_type' as current_plan_type,
  bs.metadata->>'plan_name' as current_plan_name,
  bs.metadata->>'interval' as interval,
  bs.metadata as full_metadata,
  bs.created_at,
  bs.updated_at
FROM billing_subscriptions bs
JOIN billing_customers bc ON bc.id = bs.billing_customer_id
JOIN users u ON u.id = bc.user_id
WHERE u.email = 'mcddsl@icloud.com'
ORDER BY bs.created_at DESC;

-- Step 4: Check active/trialing subscription specifically
SELECT 
  u.email,
  bs.stripe_subscription_id,
  bs.stripe_price_id,
  bs.status,
  bs.metadata->>'plan_type' as plan_type,
  bs.metadata->>'plan_name' as plan_name,
  bs.metadata as full_metadata
FROM users u
JOIN billing_customers bc ON bc.user_id = u.id
JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.email = 'mcddsl@icloud.com'
  AND bs.status IN ('active', 'trialing')
ORDER BY bs.created_at DESC
LIMIT 1;

