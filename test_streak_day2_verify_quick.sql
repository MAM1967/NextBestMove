-- Quick verification: Check metadata was updated
SELECT 
  metadata->'streak_notifications'->>'day2_detected' as day2_detected,
  metadata->'streak_notifications'->>'last_day' as last_day,
  metadata->'streak_notifications'->>'last_notification_date' as last_notification_date
FROM users
WHERE email = 'mcddsl@icloud.com';
-- Should show: day2_detected: "true", last_day: "2"

