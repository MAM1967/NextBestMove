-- Update existing old actions to ensure they meet stale criteria
-- This will check the actions from 11/17 and 11/19 and make sure they're in NEW state and not snoozed

UPDATE actions
SET 
  state = 'NEW',
  snooze_until = NULL
WHERE user_id = '1399963d-9c8b-421a-9d0a-a85c94f2f9c5'
  AND created_at::DATE IN ('2025-11-17', '2025-11-19')
  AND (state != 'NEW' OR snooze_until IS NOT NULL);

-- Verify the update
SELECT 
  id,
  action_type,
  state,
  description,
  created_at,
  snooze_until,
  EXTRACT(DAY FROM (CURRENT_TIMESTAMP - created_at))::INTEGER as days_old,
  CASE 
    WHEN state = 'NEW' AND snooze_until IS NULL AND created_at < (CURRENT_DATE - INTERVAL '7 days')::TIMESTAMPTZ
    THEN '✅ SHOULD APPEAR'
    ELSE '❌ Will not appear'
  END as should_appear
FROM actions
WHERE user_id = '1399963d-9c8b-421a-9d0a-a85c94f2f9c5'
  AND created_at::DATE IN ('2025-11-17', '2025-11-19')
ORDER BY created_at;






