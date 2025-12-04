-- Test 5.6: Day 7 Deduplication - Verification
-- Verify that metadata prevents duplicate notifications

SELECT 
  email,
  streak_count,
  last_action_date,
  CURRENT_DATE - last_action_date as days_inactive,
  metadata->'streak_notifications'->>'day7_sent' as day7_sent,
  metadata->'streak_notifications'->>'last_day' as last_day,
  metadata->'streak_notifications'->>'last_notification_date' as last_notification_date,
  metadata->'streak_notifications' as full_notifications
FROM users
WHERE email = 'mcddsl@icloud.com';

-- Expected results:
--   day7_sent: "true"
--   last_day: "7"
--   last_notification_date: Current UTC date (e.g., "2025-12-04")
--   days_inactive: 7

-- This confirms that:
--   1. First cron run updated metadata (day7_sent: true, last_day: 7)
--   2. Second cron run skipped because last_day >= 7 (deduplication working)

