-- Check current subscription metadata
SELECT 
  u.email,
  bs.id as subscription_id,
  bs.status,
  bs.metadata,
  bs.metadata->>'plan_type' as current_plan_type,
  bs.metadata->>'plan_name' as current_plan_name
FROM users u
JOIN billing_customers bc ON bc.user_id = u.id
JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.email = 'mcddsl+test1@gmail.com' -- CHANGE THIS EMAIL
ORDER BY bs.created_at DESC
LIMIT 5;

-- Update subscription metadata to use 'premium' (handles legacy values)
UPDATE billing_subscriptions
SET metadata = jsonb_set(
  jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{plan_type}',
    '"premium"'
  ),
  '{plan_name}',
  '"Premium"'
)
WHERE id IN (
  SELECT bs.id
  FROM users u
  JOIN billing_customers bc ON bc.user_id = u.id
  JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
  WHERE u.email = 'mcddsl+test1@gmail.com' -- CHANGE THIS EMAIL
    AND bs.status IN ('active', 'trialing')
);

-- Verify the update
SELECT 
  u.email,
  bs.id as subscription_id,
  bs.status,
  bs.metadata->>'plan_type' as plan_type,
  bs.metadata->>'plan_name' as plan_name
FROM users u
JOIN billing_customers bc ON bc.user_id = u.id
JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.email = 'mcddsl+test1@gmail.com' -- CHANGE THIS EMAIL
ORDER BY bs.created_at DESC;






