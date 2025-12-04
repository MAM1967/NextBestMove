-- Check performance timeline data for mcddsl@icloud.com
-- This script helps diagnose why the Performance Timeline shows no data

-- Step 1: Check if user exists and has Premium subscription
SELECT 
  u.id as user_id,
  u.email,
  bs.status as subscription_status,
  bs.metadata->>'plan_type' as plan_type,
  bs.metadata->>'plan_name' as plan_name
FROM users u
LEFT JOIN billing_customers bc ON bc.user_id = u.id
LEFT JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.email = 'mcddsl@icloud.com'
  AND bs.status IN ('active', 'trialing')
ORDER BY bs.created_at DESC
LIMIT 1;

-- Step 2: Check if any performance timeline data exists for this user
SELECT 
  COUNT(*) as total_records,
  MIN(date) as earliest_date,
  MAX(date) as latest_date
FROM performance_timeline_data
WHERE user_id = (
  SELECT id FROM users WHERE email = 'mcddsl@icloud.com'
);

-- Step 3: Check recent activity (actions) for this user
SELECT 
  DATE(created_at) as date,
  COUNT(*) as actions_created,
  COUNT(CASE WHEN state IN ('DONE', 'REPLIED', 'SENT') THEN 1 END) as actions_completed,
  COUNT(CASE WHEN state = 'REPLIED' THEN 1 END) as replies_received
FROM actions
WHERE user_id = (SELECT id FROM users WHERE email = 'mcddsl@icloud.com')
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 10;

-- Step 4: Check if cron job has run (look for any recent timeline data)
SELECT 
  date,
  metrics,
  created_at,
  updated_at
FROM performance_timeline_data
WHERE user_id = (SELECT id FROM users WHERE email = 'mcddsl@icloud.com')
ORDER BY date DESC
LIMIT 5;

