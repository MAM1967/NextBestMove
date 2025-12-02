-- Find the stale test actions that should have been inserted
-- Look for actions created on 11/17 or 11/19, 2025

SELECT 
  a.id,
  a.action_type,
  a.state,
  a.description,
  a.created_at,
  a.snooze_until,
  a.user_id,
  EXTRACT(DAY FROM (CURRENT_TIMESTAMP - a.created_at))::INTEGER as days_old
FROM actions a
WHERE a.created_at::DATE IN ('2025-11-17', '2025-11-19')
ORDER BY a.created_at DESC;

-- If no results, the migration may not have run successfully
-- Check if there are ANY actions older than 7 days
SELECT 
  COUNT(*) as count_old_actions,
  MIN(created_at) as oldest_action,
  MAX(created_at) as newest_action
FROM actions
WHERE created_at < (CURRENT_DATE - INTERVAL '7 days')::TIMESTAMPTZ;






