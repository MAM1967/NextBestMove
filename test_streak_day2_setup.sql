-- Test 5.2: Day 2 Micro Mode Activation - Setup SQL
-- Set up user with 2 days inactive

WITH user_info AS (
  SELECT id as user_id
  FROM users
  WHERE email = 'mcddsl@icloud.com'
  LIMIT 1
)
-- Set streak_count to 0 and last_action_date to 2 days ago
UPDATE users
SET 
  streak_count = 0,
  last_action_date = (CURRENT_DATE - INTERVAL '2 days')::date,
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
  CURRENT_DATE - last_action_date as days_inactive_sql,
  -- Simulate JavaScript Date.now() calculation
  FLOOR(EXTRACT(EPOCH FROM (NOW() - last_action_date::timestamp)) / 86400)::integer as days_inactive_js_calc,
  metadata->'streak_notifications' as notifications
FROM users
WHERE email = 'mcddsl@icloud.com';
-- Should show: streak_count = 0, days_inactive_js_calc = 2

