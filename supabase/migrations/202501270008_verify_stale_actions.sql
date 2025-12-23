-- Quick verification query to check if stale actions exist
-- Run this to see what actions were created and their details

SELECT 
  a.id,
  a.action_type,
  a.state,
  a.description,
  a.created_at,
  a.snooze_until,
  a.due_date,
  EXTRACT(DAY FROM (CURRENT_TIMESTAMP - a.created_at))::INTEGER as days_old,
  CASE 
    WHEN a.state = 'NEW' AND a.snooze_until IS NULL AND a.created_at < (CURRENT_DATE - INTERVAL '7 days')::TIMESTAMPTZ 
    THEN 'YES - Should appear as stale'
    ELSE 'NO'
  END as is_stale
FROM actions a
WHERE a.user_id = (SELECT id FROM users LIMIT 1)
ORDER BY a.created_at DESC
LIMIT 10;











