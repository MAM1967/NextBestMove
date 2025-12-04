-- Direct fix: Update plan_type to Premium for mcddsl@icloud.com
-- Based on the stripe_price_id being 'price_test_premium_monthly'
-- This fixes the mismatch between Stripe (Premium) and database (Standard)

-- Step 1: Verify the subscription exists and check current state
SELECT 
  u.email,
  bs.id as subscription_id,
  bs.stripe_subscription_id,
  bs.stripe_price_id,
  bs.status,
  bs.metadata->>'plan_type' as current_plan_type,
  bs.metadata->>'plan_name' as current_plan_name,
  bs.metadata as full_metadata
FROM users u
JOIN billing_customers bc ON bc.user_id = u.id
JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.email = 'mcddsl@icloud.com'
  AND bs.status IN ('active', 'trialing')
ORDER BY bs.created_at DESC
LIMIT 1;

-- Step 2: Update plan_type to Premium based on stripe_price_id
-- This will fix the subscription with stripe_price_id = 'price_test_premium_monthly'
UPDATE billing_subscriptions
SET metadata = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{plan_type}',
      '"premium"'
    ),
    '{plan_name}',
    '"Premium"'
  ),
  '{interval}',
  '"month"'
)
WHERE id IN (
  SELECT bs.id
  FROM users u
  JOIN billing_customers bc ON bc.user_id = u.id
  JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
  WHERE u.email = 'mcddsl@icloud.com'
    AND bs.status IN ('active', 'trialing')
    AND bs.stripe_price_id = 'price_test_premium_monthly'
  ORDER BY bs.created_at DESC
  LIMIT 1
);

-- Step 3: Verify the fix worked
SELECT 
  u.email,
  bs.stripe_subscription_id,
  bs.stripe_price_id,
  bs.status,
  bs.metadata->>'plan_type' as plan_type,
  bs.metadata->>'plan_name' as plan_name,
  bs.metadata->>'interval' as interval,
  bs.metadata as full_metadata
FROM users u
JOIN billing_customers bc ON bc.user_id = u.id
JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.email = 'mcddsl@icloud.com'
  AND bs.status IN ('active', 'trialing')
ORDER BY bs.created_at DESC
LIMIT 1;

