-- Quick verification: Check metadata was updated
SELECT 
  metadata->'streak_notifications'->>'day7_sent' as day7_sent,
  metadata->'streak_notifications'->>'last_day' as last_day,
  metadata->'streak_notifications'->>'last_notification_date' as last_notification_date
FROM users
WHERE email = 'mcddsl@icloud.com';
-- Should show: day7_sent: "true", last_day: "7"

