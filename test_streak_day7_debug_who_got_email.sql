-- Debug: Check which users got Day 7 emails
-- This helps identify if the test user or another user received the email

-- Check all users with Day 7 notification sent
SELECT 
  u.email,
  u.streak_count,
  u.last_action_date,
  CURRENT_DATE - u.last_action_date as days_inactive,
  u.metadata->'streak_notifications'->>'day7_sent' as day7_sent,
  u.metadata->'streak_notifications'->>'last_day' as last_day,
  u.metadata->'streak_notifications'->>'last_notification_date' as last_notification_date,
  bs.status as subscription_status,
  CASE 
    WHEN bs.status IN ('active', 'trialing') THEN 'HAS subscription'
    ELSE 'NO subscription'
  END as subscription_check
FROM users u
LEFT JOIN billing_customers bc ON bc.user_id = u.id
LEFT JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.metadata->'streak_notifications'->>'day7_sent' = 'true'
  AND u.metadata->'streak_notifications'->>'last_notification_date' = CURRENT_DATE::text
ORDER BY u.email;

-- Specifically check the test user
SELECT 
  u.email,
  u.streak_count,
  u.last_action_date,
  CURRENT_DATE - u.last_action_date as days_inactive,
  u.metadata->'streak_notifications'->>'day7_sent' as day7_sent,
  bs.status as subscription_status,
  bc.id as billing_customer_id,
  bs.id as subscription_id
FROM users u
LEFT JOIN billing_customers bc ON bc.user_id = u.id
LEFT JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.email = 'mcddsl+onboard1@gmail.com'
ORDER BY bs.created_at DESC
LIMIT 1;

