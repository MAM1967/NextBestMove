-- Fix Day 21 Grace Period for User: cea4b2e8-462f-48bc-a397-5cf92bf3b335
-- Set to 6 days 23 hours ago to ensure it's still in grace period (last day)

-- Step 1: Set to Day 21 (6 days 23 hours ago - still in grace period, last day)
UPDATE billing_subscriptions 
SET 
  trial_ends_at = NOW() - INTERVAL '6 days 23 hours',
  status = 'canceled',
  current_period_end = NOW() - INTERVAL '6 days 23 hours',
  updated_at = NOW()
WHERE billing_customer_id = (
  SELECT id FROM billing_customers 
  WHERE user_id = 'cea4b2e8-462f-48bc-a397-5cf92bf3b335'
);

-- Step 2: Verify the fix
SELECT 
  'Verification' as step,
  bs.status,
  bs.trial_ends_at,
  EXTRACT(EPOCH FROM (NOW() - bs.trial_ends_at)) / 86400 as days_since_trial_ended,
  EXTRACT(EPOCH FROM ((bs.trial_ends_at + INTERVAL '7 days') - NOW())) / 86400 as days_remaining_in_grace,
  CEIL(EXTRACT(EPOCH FROM ((bs.trial_ends_at + INTERVAL '7 days') - NOW())) / 86400) as days_remaining_rounded,
  CASE 
    WHEN bs.status = 'canceled' 
     AND bs.trial_ends_at IS NOT NULL 
     AND bs.trial_ends_at <= NOW() 
     AND bs.trial_ends_at > NOW() - INTERVAL '7 days' 
    THEN '✅ BANNER SHOULD SHOW'
    ELSE '❌ BANNER WILL NOT SHOW'
  END as banner_status
FROM billing_subscriptions bs
WHERE bs.billing_customer_id = (
  SELECT id FROM billing_customers 
  WHERE user_id = 'cea4b2e8-462f-48bc-a397-5cf92bf3b335'
)
ORDER BY bs.created_at DESC
LIMIT 1;

