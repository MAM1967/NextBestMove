-- Test 5.4: Day 7 Billing Pause Offer - Verification SQL
-- Check that metadata was updated and email was sent

-- 1. Check metadata was updated
SELECT 
  id,
  email,
  streak_count,
  last_action_date,
  CURRENT_DATE - last_action_date as days_inactive,
  metadata->'streak_notifications' as notifications,
  metadata->'streak_notifications'->>'day7_sent' as day7_sent,
  metadata->'streak_notifications'->>'last_day' as last_day,
  metadata->'streak_notifications'->>'last_notification_date' as last_notification_date
FROM users
WHERE email = 'mcddsl@icloud.com';
-- Should show: 
--   day7_sent: "true"
--   last_day: "7"
--   last_notification_date: "2025-12-04" (or current UTC date)

-- 2. Verify subscription status (should be active/trialing for email to be sent)
SELECT 
  u.email,
  bs.status as subscription_status,
  bs.stripe_subscription_id
FROM users u
LEFT JOIN billing_customers bc ON bc.user_id = u.id
LEFT JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.email = 'mcddsl@icloud.com'
ORDER BY bs.created_at DESC
LIMIT 1;
-- Should show: subscription_status = 'active' or 'trialing'

