-- Test 1: Day 1 Streak Break Detection - Verification SQL
-- Check that metadata was updated after cron job runs

SELECT 
  id,
  email,
  streak_count,
  last_action_date,
  CURRENT_DATE - last_action_date as days_inactive,
  metadata->'streak_notifications' as notifications
FROM users
WHERE email = 'mcddsl@icloud.com';
-- Should show: {"day1_sent": true, "last_day": 1, "last_notification_date": "2025-01-XX"}

