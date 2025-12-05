-- Import users into staging database
-- Run this in your STAGING Supabase SQL Editor
-- 
-- IMPORTANT: You'll need to:
-- 1. Export users from production (see export-users-from-prod.sql)
-- 2. Create auth.users records first (via Supabase Dashboard or API)
-- 3. Then import the public.users data

-- Step 1: Create auth.users records first
-- Go to: Authentication → Users → Add User
-- Or use the Supabase Management API
-- 
-- For each user, create an auth.users record with:
-- - email
-- - encrypted_password (or use password reset flow)
-- - email_confirmed_at (set to now() for testing)

-- Step 2: Insert users into public.users table
-- Replace the values below with your exported data
-- Make sure the id matches the auth.users.id

INSERT INTO users (
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
) VALUES
  -- User 1: Replace with actual data
  (
    'USER_ID_1'::uuid,
    'user1@example.com',
    'Test User 1',
    'America/New_York',
    false,
    0,
    NULL,
    now(),
    now(),
    NULL,
    NULL,
    NULL,
    NULL,
    true,
    '{}'::jsonb,
    '{}'::jsonb
  ),
  -- User 2
  (
    'USER_ID_2'::uuid,
    'user2@example.com',
    'Test User 2',
    'America/New_York',
    false,
    0,
    NULL,
    now(),
    now(),
    NULL,
    NULL,
    NULL,
    NULL,
    true,
    '{}'::jsonb,
    '{}'::jsonb
  ),
  -- User 3
  (
    'USER_ID_3'::uuid,
    'user3@example.com',
    'Test User 3',
    'America/New_York',
    false,
    0,
    NULL,
    now(),
    now(),
    NULL,
    NULL,
    NULL,
    NULL,
    true,
    '{}'::jsonb,
    '{}'::jsonb
  ),
  -- User 4
  (
    'USER_ID_4'::uuid,
    'user4@example.com',
    'Test User 4',
    'America/New_York',
    false,
    0,
    NULL,
    now(),
    now(),
    NULL,
    NULL,
    NULL,
    NULL,
    true,
    '{}'::jsonb,
    '{}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  updated_at = now();

-- Step 3: (Optional) Import related data
-- Import leads, actions, etc. if you exported them
-- Make sure to update user_id references if they changed

