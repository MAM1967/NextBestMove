-- Fix for Day 1 test - Set last_action_date to ensure exactly 1 day calculation
-- The issue is that getDaysSinceLastAction uses Date.now() which includes time
-- We need to set last_action_date to be exactly 24+ hours ago

-- Option 1: Set to exactly 1 day ago at midnight (safest)
UPDATE users
SET 
  streak_count = 0,
  last_action_date = (CURRENT_DATE - INTERVAL '1 day')::date,
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'streak_notifications', jsonb_build_object()
  )
WHERE email = 'mcddsl@icloud.com';

-- Option 2: Set to 25 hours ago (more reliable for Date.now() calculation)
-- This ensures the JavaScript calculation will definitely be >= 1 day
-- UPDATE users
-- SET 
--   streak_count = 0,
--   last_action_date = (NOW() - INTERVAL '25 hours')::date,
--   metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
--     'streak_notifications', jsonb_build_object()
--   )
-- WHERE email = 'mcddsl@icloud.com';

-- Verify the calculation
SELECT 
  email,
  last_action_date,
  CURRENT_DATE - last_action_date as days_inactive_sql,
  -- Simulate JavaScript Date.now() calculation
  FLOOR(EXTRACT(EPOCH FROM (NOW() - last_action_date::timestamp)) / 86400)::integer as days_inactive_js_calc,
  metadata->'streak_notifications' as notifications
FROM users
WHERE email = 'mcddsl@icloud.com';
-- Should show: days_inactive_js_calc = 1

