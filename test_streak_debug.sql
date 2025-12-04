-- Debug query to check why Day 1 detection didn't work
-- This checks the exact state of the test user and how getDaysSinceLastAction calculates

SELECT 
  id,
  email,
  streak_count,
  last_action_date,
  created_at,
  CURRENT_DATE as today,
  CURRENT_DATE - last_action_date as days_inactive_sql,
  -- Simulate getDaysSinceLastAction calculation (uses Date.now() which is timezone-aware)
  -- The function uses: Math.floor((Date.now() - lastActionDate.getTime()) / (1000 * 60 * 60 * 24))
  -- This is equivalent to: FLOOR((EXTRACT(EPOCH FROM (NOW() - last_action_date::timestamp)) / 86400))
  CASE 
    WHEN last_action_date IS NOT NULL THEN
      FLOOR(EXTRACT(EPOCH FROM (NOW() - last_action_date::timestamp)) / 86400)::integer
    ELSE NULL
  END as days_inactive_function_calc,
  metadata->'streak_notifications' as notifications,
  metadata->'streak_notifications'->>'last_day' as last_notification_day,
  metadata->'streak_notifications'->>'day1_sent' as day1_sent
FROM users
WHERE email = 'mcddsl@icloud.com';

-- Also check all users with broken streaks to see what the cron job found
SELECT 
  id,
  email,
  streak_count,
  last_action_date,
  created_at,
  CURRENT_DATE - COALESCE(last_action_date, created_at::date) as days_inactive_sql,
  CASE 
    WHEN last_action_date IS NOT NULL THEN
      FLOOR(EXTRACT(EPOCH FROM (NOW() - last_action_date::timestamp)) / 86400)::integer
    WHEN created_at IS NOT NULL THEN
      FLOOR(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400)::integer
    ELSE NULL
  END as days_inactive_function_calc,
  metadata->'streak_notifications'->>'last_day' as last_notification_day
FROM users
WHERE streak_count = 0
  AND (
    last_action_date < CURRENT_DATE - INTERVAL '1 day'
    OR (last_action_date IS NULL AND created_at < NOW() - INTERVAL '1 day')
  )
ORDER BY COALESCE(last_action_date, created_at::date) DESC
LIMIT 10;
