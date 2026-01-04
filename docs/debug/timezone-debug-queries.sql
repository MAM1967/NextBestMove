-- Timezone Debug Queries
-- Run these in Supabase SQL Editor to debug the date/timezone mismatch
-- Replace 'mcddsl@icloud.com' with your email if different

-- ============================================
-- QUERY 1: Get your user's timezone setting
-- ============================================
SELECT 
  id,
  email,
  name,
  timezone,
  exclude_weekends,
  created_at
FROM users
WHERE email = 'mcddsl@icloud.com'
ORDER BY created_at DESC
LIMIT 1;

-- ============================================
-- QUERY 2: Check what date would be "today" in your timezone vs UTC
-- ============================================
-- This shows what PostgreSQL calculates for your timezone
-- FIXED: Using timezone() function instead of AT TIME ZONE pattern
SELECT 
  -- Current UTC date
  CURRENT_DATE as utc_date,
  -- Current UTC timestamp
  NOW() as utc_now,
  -- Current date in your timezone (CORRECTED: using timezone() function)
  timezone('America/New_York', NOW())::DATE as your_timezone_date,
  -- Day of week in UTC (0=Sunday, 6=Saturday)
  EXTRACT(DOW FROM CURRENT_DATE) as utc_day_of_week,
  -- Day of week in your timezone (CORRECTED)
  EXTRACT(DOW FROM timezone('America/New_York', NOW())::DATE) as your_timezone_day_of_week,
  -- Day name in UTC
  TO_CHAR(CURRENT_DATE, 'Day') as utc_day_name,
  -- Day name in your timezone (CORRECTED)
  TO_CHAR(timezone('America/New_York', NOW())::DATE, 'Day') as your_timezone_day_name;

-- ============================================
-- QUERY 3: Check existing daily plans and their dates
-- ============================================
SELECT 
  dp.id,
  dp.date as plan_date,
  dp.generated_at,
  u.email,
  u.timezone,
  -- What day of week the plan date is
  EXTRACT(DOW FROM dp.date) as plan_day_of_week,
  TO_CHAR(dp.date, 'Day') as plan_day_name
FROM daily_plans dp
JOIN users u ON dp.user_id = u.id
WHERE u.email = 'mcddsl@icloud.com'
ORDER BY dp.date DESC
LIMIT 10;

-- ============================================
-- QUERY 4: Compare UTC vs Your Timezone Date
-- ============================================
-- This is the KEY query - shows if there's a date mismatch
-- FIXED: Using timezone() function instead of AT TIME ZONE pattern
SELECT 
  u.id as user_id,
  u.email,
  u.timezone,
  -- What client would send (UTC date from JavaScript)
  CURRENT_DATE as client_sends_utc_date,
  -- What should be used (user's timezone date) - CORRECTED
  timezone(u.timezone, NOW())::DATE as should_use_timezone_date,
  -- Are they different?
  CASE 
    WHEN CURRENT_DATE != timezone(u.timezone, NOW())::DATE 
    THEN '❌ DIFFERENT - THIS IS THE PROBLEM!'
    ELSE '✅ Same - OK'
  END as date_comparison,
  -- Day of week for UTC date
  EXTRACT(DOW FROM CURRENT_DATE) as utc_day_of_week,
  -- Day of week for timezone date - CORRECTED
  EXTRACT(DOW FROM timezone(u.timezone, NOW())::DATE) as timezone_day_of_week,
  -- Is UTC date a weekend?
  CASE 
    WHEN EXTRACT(DOW FROM CURRENT_DATE) IN (0, 6) THEN 'YES - Weekend in UTC'
    ELSE 'NO - Not weekend in UTC'
  END as utc_is_weekend,
  -- Is timezone date a weekend? - CORRECTED
  CASE 
    WHEN EXTRACT(DOW FROM timezone(u.timezone, NOW())::DATE) IN (0, 6) 
    THEN 'YES - Weekend in your timezone'
    ELSE 'NO - Not weekend in your timezone'
  END as timezone_is_weekend
FROM users u
WHERE u.email = 'mcddsl@icloud.com';

