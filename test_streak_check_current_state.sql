-- Check current state of test user for streak recovery
-- This shows what day the user is on and what notifications have been sent

SELECT 
  u.id,
  u.email,
  u.streak_count,
  u.last_action_date,
  CURRENT_DATE as today,
  CURRENT_DATE - u.last_action_date as days_inactive_sql,
  -- Simulate JavaScript Date.now() calculation (what the cron job uses)
  FLOOR(EXTRACT(EPOCH FROM (NOW() - u.last_action_date::timestamp)) / 86400)::integer as days_inactive_js_calc,
  -- Show notification metadata
  u.metadata->'streak_notifications' as notifications,
  u.metadata->'streak_notifications'->>'day1_sent' as day1_sent,
  u.metadata->'streak_notifications'->>'day2_detected' as day2_detected,
  u.metadata->'streak_notifications'->>'day3_sent' as day3_sent,
  u.metadata->'streak_notifications'->>'day7_sent' as day7_sent,
  u.metadata->'streak_notifications'->>'last_day' as last_day,
  u.metadata->'streak_notifications'->>'last_notification_date' as last_notification_date,
  -- Show subscription status (needed for Day 7)
  bs.status as subscription_status
FROM users u
LEFT JOIN billing_customers bc ON bc.user_id = u.id
LEFT JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
  AND bs.status IN ('active', 'trialing')
WHERE u.email = 'mcddsl@icloud.com'
ORDER BY bs.created_at DESC
LIMIT 1;

-- Summary interpretation:
-- days_inactive_js_calc = 1 → Day 1 (push notification)
-- days_inactive_js_calc = 2 → Day 2 (Micro Mode)
-- days_inactive_js_calc = 3 → Day 3 (recovery email)
-- days_inactive_js_calc = 7 → Day 7 (billing pause, if subscription active)
-- days_inactive_js_calc = 4, 5, 6, 8+ → No notification (only 1, 2, 3, 7 are handled)

