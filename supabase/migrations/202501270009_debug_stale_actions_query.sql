-- Debug query to check why stale actions aren't showing up
-- Run this in Supabase SQL Editor to see what's happening

-- First, check what actions exist and their properties
SELECT 
  a.id,
  a.action_type,
  a.state,
  a.description,
  a.created_at,
  a.snooze_until,
  a.user_id,
  -- Calculate cutoff date (7 days ago at start of day UTC)
  (CURRENT_DATE - INTERVAL '7 days')::TIMESTAMPTZ as seven_days_ago_cutoff,
  -- Check if action meets stale criteria
  CASE 
    WHEN a.state = 'NEW' THEN '✓'
    ELSE '✗ state not NEW'
  END as state_check,
  CASE 
    WHEN a.snooze_until IS NULL THEN '✓'
    ELSE '✗ snoozed'
  END as snooze_check,
  CASE 
    WHEN a.created_at < (CURRENT_DATE - INTERVAL '7 days')::TIMESTAMPTZ THEN '✓'
    ELSE '✗ not old enough'
  END as age_check,
  -- Calculate days old
  EXTRACT(DAY FROM (CURRENT_TIMESTAMP - a.created_at))::INTEGER as days_old,
  -- Overall check
  CASE 
    WHEN a.state = 'NEW' 
      AND a.snooze_until IS NULL 
      AND a.created_at < (CURRENT_DATE - INTERVAL '7 days')::TIMESTAMPTZ
    THEN '✅ SHOULD APPEAR'
    ELSE '❌ Will not appear'
  END as should_appear
FROM actions a
ORDER BY a.created_at DESC
LIMIT 10;



