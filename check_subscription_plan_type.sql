-- Check subscription plan_type for a user
-- This helps verify if plan_type is correctly set after Stripe subscription change

SELECT 
  u.email,
  u.id as user_id,
  bc.stripe_customer_id,
  bs.stripe_subscription_id,
  bs.status as subscription_status,
  bs.metadata->>'plan_name' as plan_name,
  bs.metadata->>'plan_type' as plan_type,
  bs.metadata as full_metadata,
  bs.updated_at as subscription_updated_at
FROM users u
LEFT JOIN billing_customers bc ON bc.user_id = u.id
LEFT JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.email = 'mcddsl@icloud.com'
ORDER BY bs.created_at DESC
LIMIT 1;

-- Expected result after upgrade:
--   plan_type: "premium"
--   plan_name: "Premium"
--   subscription_status: "active" or "trialing"


