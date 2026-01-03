-- Check what timezone is actually stored in the database for your user
-- Run this in Supabase SQL Editor

-- 1. Check your user's timezone setting
SELECT 
  id,
  email,
  name,
  timezone,
  exclude_weekends,
  created_at,
  updated_at
FROM users
WHERE email = 'mcddsl@icloud.com'  -- Replace with your email
ORDER BY created_at DESC
LIMIT 1;

-- 2. Verify the timezone value matches what you selected in settings
-- "Eastern Time (ET)" should map to "America/New_York"
SELECT 
  CASE 
    WHEN timezone = 'America/New_York' THEN '✅ Correct - America/New_York matches Eastern Time (ET)'
    ELSE '❌ MISMATCH - Expected America/New_York but found: ' || timezone
  END as timezone_check,
  timezone,
  email
FROM users
WHERE email = 'mcddsl@icloud.com';

-- 3. Test what date PostgreSQL thinks it is in your timezone vs UTC
-- Replace 'America/New_York' with your actual timezone from query 1
SELECT 
  -- Current UTC date
  CURRENT_DATE as utc_date,
  -- Current UTC timestamp
  NOW() as utc_now,
  -- Current date in your timezone
  (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York')::DATE as your_timezone_date,
  -- Day of week in UTC (0=Sunday, 6=Saturday)
  EXTRACT(DOW FROM CURRENT_DATE) as utc_day_of_week,
  -- Day of week in your timezone
  EXTRACT(DOW FROM (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York')::DATE) as your_timezone_day_of_week,
  -- Day name in UTC
  TO_CHAR(CURRENT_DATE, 'Day') as utc_day_name,
  -- Day name in your timezone
  TO_CHAR((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York')::DATE, 'Day') as your_timezone_day_name,
  -- Is it a weekend in your timezone?
  CASE 
    WHEN EXTRACT(DOW FROM (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York')::DATE) IN (0, 6) 
    THEN 'YES - Weekend'
    ELSE 'NO - Not weekend'
  END as is_weekend_in_your_timezone;

-- 4. Compare: What the code should calculate vs what's in DB
SELECT 
  u.id,
  u.email,
  u.timezone as db_timezone,
  -- What date should be used (based on DB timezone)
  (NOW() AT TIME ZONE 'UTC' AT TIME ZONE u.timezone)::DATE as should_use_date,
  -- What day of week that is
  EXTRACT(DOW FROM (NOW() AT TIME ZONE 'UTC' AT TIME ZONE u.timezone)::DATE) as should_use_day_of_week,
  TO_CHAR((NOW() AT TIME ZONE 'UTC' AT TIME ZONE u.timezone)::DATE, 'Day') as should_use_day_name,
  -- Is it a weekend?
  CASE 
    WHEN EXTRACT(DOW FROM (NOW() AT TIME ZONE 'UTC' AT TIME ZONE u.timezone)::DATE) IN (0, 6) 
    THEN 'YES'
    ELSE 'NO'
  END as is_weekend
FROM users u
WHERE u.email = 'mcddsl@icloud.com';

