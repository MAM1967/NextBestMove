-- Test 5.2: Day 2 Micro Mode Activation - Verification SQL
-- Check that metadata was updated and verify plan generation

-- 1. Check metadata was updated
SELECT 
  id,
  email,
  streak_count,
  last_action_date,
  CURRENT_DATE - last_action_date as days_inactive,
  metadata->'streak_notifications' as notifications,
  metadata->'streak_notifications'->>'day2_detected' as day2_detected,
  metadata->'streak_notifications'->>'last_day' as last_day
FROM users
WHERE email = 'mcddsl@icloud.com';
-- Should show: day2_detected: "true", last_day: "2"

-- 2. Check if daily plan was generated with Micro Mode
SELECT 
  dp.id,
  dp.date,
  dp.capacity,
  dp.focus_statement,
  COUNT(dpa.id) as action_count
FROM daily_plans dp
LEFT JOIN daily_plan_actions dpa ON dpa.daily_plan_id = dp.id
WHERE dp.user_id = (SELECT id FROM users WHERE email = 'mcddsl@icloud.com')
  AND dp.date = CURRENT_DATE
GROUP BY dp.id, dp.date, dp.capacity, dp.focus_statement;
-- Should show: 
--   capacity = 'micro'
--   focus_statement = 'Let's ease back in — here are your highest-impact moves for today.'
--   action_count = 2

