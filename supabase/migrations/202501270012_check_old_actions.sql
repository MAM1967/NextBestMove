-- Check why old actions (11/17 and 11/19) aren't showing up
-- This will show the exact state of those actions and why they might be filtered out

SELECT 
  a.id,
  a.action_type,
  a.state,
  a.description,
  a.created_at,
  a.snooze_until,
  a.user_id,
  -- Check each filter condition
  CASE WHEN a.state = 'NEW' THEN '✓' ELSE '✗' END as state_is_new,
  CASE WHEN a.snooze_until IS NULL THEN '✓' ELSE '✗ SNOOZED' END as not_snoozed,
  -- Calculate 7 days ago cutoff (in UTC, start of day)
  (CURRENT_DATE - INTERVAL '7 days')::TIMESTAMPTZ as seven_days_ago_cutoff,
  -- Check if older than 7 days
  CASE 
    WHEN a.created_at < (CURRENT_DATE - INTERVAL '7 days')::TIMESTAMPTZ 
    THEN '✓ OLD ENOUGH' 
    ELSE '✗ TOO RECENT' 
  END as age_check,
  -- Days old
  EXTRACT(DAY FROM (CURRENT_TIMESTAMP - a.created_at))::INTEGER as days_old,
  -- Overall: should this appear?
  CASE 
    WHEN a.state = 'NEW' 
      AND a.snooze_until IS NULL 
      AND a.created_at < (CURRENT_DATE - INTERVAL '7 days')::TIMESTAMPTZ
    THEN '✅ SHOULD APPEAR'
    ELSE '❌ FILTERED OUT'
  END as should_appear,
  -- Why filtered out?
  CASE 
    WHEN a.state != 'NEW' THEN 'State is not NEW'
    WHEN a.snooze_until IS NOT NULL THEN 'Action is snoozed'
    WHEN a.created_at >= (CURRENT_DATE - INTERVAL '7 days')::TIMESTAMPTZ THEN 'Not old enough (< 7 days)'
    ELSE 'Should appear!'
  END as reason
FROM actions a
WHERE a.created_at::DATE IN ('2025-11-17', '2025-11-19')
ORDER BY a.created_at;




