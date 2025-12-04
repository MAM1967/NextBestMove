-- Test 1: Day 1 Streak Break Detection - Setup SQL
-- IMPORTANT: Run the migration first: 202501300002_add_users_metadata.sql
-- Set up user with broken streak (1 day inactive)

WITH user_info AS (
  SELECT id as user_id
  FROM users
  WHERE email = 'mcddsl@icloud.com'
  LIMIT 1
)
-- Set streak_count to 0 and last_action_date to 1 day ago
UPDATE users
SET 
  streak_count = 0,
  last_action_date = CURRENT_DATE - INTERVAL '1 day',
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'streak_notifications', jsonb_build_object()
  )
WHERE id = (SELECT user_id FROM user_info);

-- Verify setup
SELECT 
  id, 
  email, 
  streak_count, 
  last_action_date,
  CURRENT_DATE - last_action_date as days_inactive,
  metadata->'streak_notifications' as notifications
FROM users
WHERE email = 'mcddsl@icloud.com';
-- Should show: streak_count = 0, days_inactive = 1

