-- Export 4 test users from production database
-- Run this in your PRODUCTION Supabase SQL Editor
-- This exports users and their basic profile data

-- Step 1: Export users table data
SELECT 
  id,
  email,
  name,
  timezone,
  calendar_connected,
  streak_count,
  last_action_date,
  created_at,
  updated_at,
  weekend_preference,
  work_start_time,
  work_end_time,
  time_format_preference,
  onboarding_completed,
  email_preferences,
  metadata
FROM users
ORDER BY created_at
LIMIT 4;

-- Step 2: Export auth.users data (you'll need to run this separately or combine)
-- Note: You may need service role access to query auth.users directly
-- Alternative: Use Supabase Dashboard → Authentication → Users to export

-- Step 3: Export related data for these users (optional, for more complete test data)
-- Leads
SELECT * FROM leads WHERE user_id IN (
  SELECT id FROM users ORDER BY created_at LIMIT 4
);

-- Actions (sample)
SELECT * FROM actions WHERE user_id IN (
  SELECT id FROM users ORDER BY created_at LIMIT 4
) LIMIT 50;

-- Daily plans (recent)
SELECT * FROM daily_plans WHERE user_id IN (
  SELECT id FROM users ORDER BY created_at LIMIT 4
) ORDER BY plan_date DESC LIMIT 20;

-- Weekly summaries (recent)
SELECT * FROM weekly_summaries WHERE user_id IN (
  SELECT id FROM users ORDER BY created_at LIMIT 4
) ORDER BY week_start_date DESC LIMIT 10;

