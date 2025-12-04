-- Test 5.5: Day 7 Skip (No Subscription) - Setup
-- Set up user with 7 days inactive but NO active subscription

WITH user_info AS (
  SELECT id as user_id
  FROM users
  WHERE email = 'mcddsl+onboard1@gmail.com'
  LIMIT 1
)
-- Set user to 7 days inactive and clear metadata
UPDATE users
SET
  streak_count = 0,
  last_action_date = CURRENT_DATE - INTERVAL '7 days',
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'streak_notifications', jsonb_build_object()
  )
WHERE id = (SELECT user_id FROM user_info);

-- Verify setup: user should be 7 days inactive with NO active subscription
SELECT
  u.id,
  u.email,
  u.streak_count,
  u.last_action_date,
  CURRENT_DATE - u.last_action_date as days_inactive,
  bs.status as subscription_status,
  CASE 
    WHEN bs.status IN ('active', 'trialing') THEN 'HAS subscription'
    ELSE 'NO subscription'
  END as subscription_check
FROM users u
LEFT JOIN billing_customers bc ON bc.user_id = u.id
LEFT JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.email = 'mcddsl+onboard1@gmail.com'
ORDER BY bs.created_at DESC
LIMIT 1;
-- Expected: days_inactive = 7, subscription_status = NULL or 'canceled' or 'past_due'

