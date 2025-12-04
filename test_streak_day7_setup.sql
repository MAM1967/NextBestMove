-- Test 5.4: Day 7 Billing Pause Offer - Setup SQL
-- Set up user with 7 days inactive AND active subscription

WITH user_info AS (
  SELECT id as user_id
  FROM users
  WHERE email = 'mcddsl@icloud.com'
  LIMIT 1
)
-- Set streak_count to 0 and last_action_date to 7 days ago
UPDATE users
SET 
  streak_count = 0,
  last_action_date = (CURRENT_DATE - INTERVAL '7 days')::date,
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'streak_notifications', jsonb_build_object()
  )
WHERE id = (SELECT user_id FROM user_info);

-- Verify setup - check user state
SELECT 
  u.id, 
  u.email, 
  u.streak_count, 
  u.last_action_date,
  CURRENT_DATE - u.last_action_date as days_inactive_sql,
  -- Simulate JavaScript Date.now() calculation
  FLOOR(EXTRACT(EPOCH FROM (NOW() - u.last_action_date::timestamp)) / 86400)::integer as days_inactive_js_calc,
  u.metadata->'streak_notifications' as notifications
FROM users u
WHERE u.email = 'mcddsl@icloud.com';
-- Should show: streak_count = 0, days_inactive_js_calc = 7

-- Verify subscription status (user must have active/trialing subscription)
SELECT 
  u.email,
  bc.id as billing_customer_id,
  bs.status as subscription_status,
  bs.stripe_subscription_id,
  bs.current_period_end
FROM users u
LEFT JOIN billing_customers bc ON bc.user_id = u.id
LEFT JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.email = 'mcddsl@icloud.com'
ORDER BY bs.created_at DESC
LIMIT 1;
-- Should show: subscription_status = 'active' or 'trialing'
-- If NULL or 'canceled'/'past_due', you need to create/update subscription in Stripe

