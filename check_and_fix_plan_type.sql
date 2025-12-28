-- Quick check: Verify plan_type for a user
-- Then use the TypeScript script to fix if needed

-- Step 1: Check current state
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

-- Step 2: If plan_type is wrong, you can manually update it:
-- (But better to use the TypeScript script which determines it from price_id)
--
-- UPDATE billing_subscriptions
-- SET metadata = jsonb_set(
--   COALESCE(metadata, '{}'::jsonb),
--   '{plan_type}',
--   '"premium"'
-- )
-- WHERE id = (SELECT bs.id FROM users u
--   JOIN billing_customers bc ON bc.user_id = u.id
--   JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
--   WHERE u.email = 'mcddsl@icloud.com'
--     AND bs.status IN ('active', 'trialing')
--   ORDER BY bs.created_at DESC
--   LIMIT 1);









