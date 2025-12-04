-- Manual fix: Update plan_type to Premium for mcddsl@icloud.com
-- Use this if the sync script doesn't work or you need to fix it directly in the database
-- 
-- IMPORTANT: First run check_premium_user_status.sql to see the current state
-- Then check the stripe_price_id matches your Premium price ID from environment variables

-- Step 1: Check current state (run this first!)
SELECT 
  u.email,
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

-- Step 2: Update plan_type to Premium (only if stripe_price_id matches Premium price ID)
-- Replace 'YOUR_PREMIUM_PRICE_ID' with your actual Premium price ID from .env.local
-- You can find it in: STRIPE_PRICE_ID_PREMIUM_MONTHLY or STRIPE_PRICE_ID_PREMIUM_YEARLY

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
  CASE 
    WHEN stripe_price_id = (SELECT value FROM (VALUES ('YOUR_PREMIUM_YEARLY_PRICE_ID')) AS t(value)) THEN '"year"'
    ELSE '"month"'
  END
)
WHERE id IN (
  SELECT bs.id
  FROM users u
  JOIN billing_customers bc ON bc.user_id = u.id
  JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
  WHERE u.email = 'mcddsl@icloud.com'
    AND bs.status IN ('active', 'trialing')
  ORDER BY bs.created_at DESC
  LIMIT 1
)
-- Only update if price_id matches Premium (safety check)
AND stripe_price_id IN (
  -- Add your Premium price IDs here (from .env.local)
  'YOUR_PREMIUM_MONTHLY_PRICE_ID',
  'YOUR_PREMIUM_YEARLY_PRICE_ID'
);

-- Step 3: Verify the update
SELECT 
  u.email,
  bs.stripe_subscription_id,
  bs.stripe_price_id,
  bs.status,
  bs.metadata->>'plan_type' as plan_type,
  bs.metadata->>'plan_name' as plan_name,
  bs.metadata->>'interval' as interval
FROM users u
JOIN billing_customers bc ON bc.user_id = u.id
JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.email = 'mcddsl@icloud.com'
  AND bs.status IN ('active', 'trialing')
ORDER BY bs.created_at DESC
LIMIT 1;

