-- Step 1: Create auth.users records in staging
-- Go to: https://supabase.com/dashboard/project/adgiptzbxnzddbgfeuut/auth/users
-- Click "Add User" for each of these 4 users:
-- 
-- User 1: mcddsl@icloud.com (password: TestPass123!)
-- User 2: mcddsl@gmail.com (password: TestPass123!)
-- User 3: mcddsl+test1@gmail.com (password: TestPass123!)
-- User 4: mcddsl+onboard1@gmail.com (password: TestPass123!)
--
-- Copy the User IDs that are created and use them below

-- Step 2: Insert users into public.users table
-- UUIDs are already set (created on 2025-01-XX)

INSERT INTO users (
  id, 
  email, 
  name, 
  timezone, 
  calendar_connected, 
  streak_count, 
  last_action_date, 
  created_at, 
  updated_at
) VALUES
  -- User 1: mcddsl@icloud.com
  (
    'af366067-1475-4629-bcaf-587fbece3aae'::uuid,
    'mcddsl@icloud.com',
    'Michael McDermott',
    'America/New_York',
    false,
    0,
    '2025-11-27'::date,
    '2025-11-26 19:20:26.986876+00'::timestamptz,
    '2025-12-04 20:39:41.710287+00'::timestamptz
  ),
  -- User 2: mcddsl@gmail.com
  (
    '470b750a-c1e2-46d4-b2fc-c162bbe00e3f'::uuid,
    'mcddsl@gmail.com',
    'Michael Test',
    'America/New_York',
    true,
    0,
    NULL,
    '2025-11-27 20:23:26.355929+00'::timestamptz,
    '2025-12-04 16:02:27.813085+00'::timestamptz
  ),
  -- User 3: mcddsl+test1@gmail.com
  (
    'e7992ba6-2aea-41df-903f-38396e9714bd'::uuid,
    'mcddsl+test1@gmail.com',
    'Michael Test2',
    'America/New_York',
    false,
    0,
    NULL,
    '2025-11-28 02:15:50.502577+00'::timestamptz,
    '2025-11-29 19:43:00.241572+00'::timestamptz
  ),
  -- User 4: mcddsl+onboard1@gmail.com
  (
    '4c51d164-b428-43db-8908-c7f2f1a8361f'::uuid,
    'mcddsl+onboard1@gmail.com',
    'Onboard Test',
    'America/New_York',
    false,
    0,
    '2025-11-27'::date,
    '2025-11-29 19:47:29.194899+00'::timestamptz,
    '2025-12-04 03:16:45.370418+00'::timestamptz
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  updated_at = now();

