-- Group 1 Testing - Quick Start Script
-- Replace <your_test_user_id> and <your_test_email> with your actual values

-- ============================================
-- STEP 1: Find Your Test User ID
-- ============================================
-- Run this first to find your user ID:
-- SELECT id, email, name FROM users WHERE email = '<your_test_email>';

-- ============================================
-- STEP 2: Verify Current State
-- ============================================
-- Check your user's current subscription state:
SELECT 
  u.email,
  bs.status,
  bs.trial_ends_at,
  CASE 
    WHEN bs.trial_ends_at IS NULL THEN 'No trial'
    WHEN bs.trial_ends_at > NOW() THEN CONCAT('Trial ends in ', CEIL(EXTRACT(EPOCH FROM (bs.trial_ends_at - NOW())) / 86400), ' days')
    WHEN bs.trial_ends_at > NOW() - INTERVAL '7 days' THEN CONCAT('Grace period: ', CEIL(EXTRACT(EPOCH FROM (NOW() - bs.trial_ends_at)) / 86400), ' days in')
    ELSE 'Past grace period'
  END as trial_state
FROM users u
LEFT JOIN billing_customers bc ON bc.user_id = u.id
LEFT JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.email = '<your_test_email>'
ORDER BY bs.created_at DESC
LIMIT 1;

-- ============================================
-- SCENARIO 1: Grace Period (Day 17)
-- ============================================
-- Uncomment to test grace period banner:
-- UPDATE billing_subscriptions 
-- SET trial_ends_at = NOW() - INTERVAL '3 days',
--     status = 'canceled'
-- WHERE billing_customer_id = (
--   SELECT id FROM billing_customers 
--   WHERE user_id = '<your_test_user_id>'
-- );

-- ============================================
-- SCENARIO 2: Day 12 Reminder
-- ============================================
-- Uncomment to test Day 12 reminder:
-- UPDATE billing_subscriptions 
-- SET trial_ends_at = NOW() + INTERVAL '2 days',
--     status = 'trialing'
-- WHERE billing_customer_id = (
--   SELECT id FROM billing_customers 
--   WHERE user_id = '<your_test_user_id>'
-- );

-- ============================================
-- SCENARIO 2: Day 14 Reminder
-- ============================================
-- Uncomment to test Day 14 reminder:
-- UPDATE billing_subscriptions 
-- SET trial_ends_at = CURRENT_DATE,
--     status = 'trialing'
-- WHERE billing_customer_id = (
--   SELECT id FROM billing_customers 
--   WHERE user_id = '<your_test_user_id>'
-- );

-- ============================================
-- SCENARIO 3: Past Due Paywall
-- ============================================
-- Uncomment to test past_due paywall variant:
-- UPDATE billing_subscriptions 
-- SET status = 'past_due'
-- WHERE billing_customer_id = (
--   SELECT id FROM billing_customers 
--   WHERE user_id = '<your_test_user_id>'
-- );

-- ============================================
-- SCENARIO 3: Canceled Paywall
-- ============================================
-- Uncomment to test canceled paywall variant:
-- UPDATE billing_subscriptions 
-- SET status = 'canceled',
--     trial_ends_at = NOW() - INTERVAL '10 days'
-- WHERE billing_customer_id = (
--   SELECT id FROM billing_customers 
--   WHERE user_id = '<your_test_user_id>'
-- );

-- ============================================
-- RESET: Back to Active Subscription
-- ============================================
-- Uncomment to reset user to active subscription:
-- UPDATE billing_subscriptions 
-- SET status = 'active',
--     trial_ends_at = NULL,
--     current_period_end = NOW() + INTERVAL '30 days'
-- WHERE billing_customer_id = (
--   SELECT id FROM billing_customers 
--   WHERE user_id = '<your_test_user_id>'
-- );

