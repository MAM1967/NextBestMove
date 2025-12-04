-- Test 5.3: Day 3 Recovery Email - Verification SQL
-- Check that metadata was updated and email was sent

SELECT 
  id,
  email,
  streak_count,
  last_action_date,
  CURRENT_DATE - last_action_date as days_inactive,
  metadata->'streak_notifications' as notifications,
  metadata->'streak_notifications'->>'day3_sent' as day3_sent,
  metadata->'streak_notifications'->>'last_day' as last_day,
  metadata->'streak_notifications'->>'last_notification_date' as last_notification_date
FROM users
WHERE email = 'mcddsl@icloud.com';
-- Should show: 
--   day3_sent: "true"
--   last_day: "3"
--   last_notification_date: "2025-12-04" (or current date)

