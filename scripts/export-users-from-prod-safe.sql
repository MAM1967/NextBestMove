-- Export users from production (safe version - only base columns)
-- Run this in your PRODUCTION Supabase SQL Editor

-- Base columns (always exist)
SELECT 
  u.id,
  u.email,
  u.name,
  u.timezone,
  u.calendar_connected,
  u.streak_count,
  u.last_action_date,
  u.created_at,
  u.updated_at,
  -- Optional columns (may not exist in all environments)
  COALESCE(u.weekend_preference, NULL) as weekend_preference,
  COALESCE(u.work_start_time::text, NULL) as work_start_time,
  COALESCE(u.work_end_time::text, NULL) as work_end_time,
  COALESCE(u.time_format_preference, NULL) as time_format_preference,
  COALESCE(u.onboarding_completed, false) as onboarding_completed,
  COALESCE(u.email_preferences::text, '{}') as email_preferences,
  COALESCE(u.metadata::text, '{}') as metadata
FROM users u
ORDER BY u.created_at
LIMIT 4;

-- Alternative: If the above still fails, use this minimal version:
/*
SELECT 
  id,
  email,
  name,
  timezone,
  calendar_connected,
  streak_count,
  last_action_date,
  created_at,
  updated_at
FROM users
ORDER BY created_at
LIMIT 4;
*/

