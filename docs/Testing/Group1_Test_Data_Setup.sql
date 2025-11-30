-- Group 1 Test Data Setup Script
-- Use this to quickly set up test users for different trial states
-- Replace <user_id> and <email> with actual test user values

-- ============================================
-- TEST USER SETUP
-- ============================================

-- First, ensure you have test users created in auth.users
-- Then run these scripts to set up their billing/subscription states

-- ============================================
-- User A: Day 11 (3 days remaining - no reminder)
-- ============================================
INSERT INTO billing_customers (user_id, stripe_customer_id, currency)
VALUES ('<user_id_a>', 'cus_test_day11', 'usd')
ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = 'cus_test_day11';

INSERT INTO billing_subscriptions (
  billing_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  status,
  current_period_end,
  trial_ends_at,
  metadata
)
SELECT 
  bc.id,
  'sub_test_day11',
  'price_test',
  'trialing',
  NOW() + INTERVAL '3 days',
  NOW() + INTERVAL '3 days',
  '{"plan_name": "Standard", "plan_type": "standard", "interval": "month"}'::jsonb
FROM billing_customers bc
WHERE bc.user_id = '<user_id_a>'
ON CONFLICT (stripe_subscription_id) DO UPDATE
SET trial_ends_at = NOW() + INTERVAL '3 days',
    status = 'trialing',
    current_period_end = NOW() + INTERVAL '3 days';

-- ============================================
-- User B: Day 12 (2 days remaining - Day 12 reminder)
-- ============================================
INSERT INTO billing_customers (user_id, stripe_customer_id, currency)
VALUES ('<user_id_b>', 'cus_test_day12', 'usd')
ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = 'cus_test_day12';

INSERT INTO billing_subscriptions (
  billing_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  status,
  current_period_end,
  trial_ends_at,
  metadata
)
SELECT 
  bc.id,
  'sub_test_day12',
  'price_test',
  'trialing',
  NOW() + INTERVAL '2 days',
  NOW() + INTERVAL '2 days',
  '{"plan_name": "Standard", "plan_type": "standard", "interval": "month"}'::jsonb
FROM billing_customers bc
WHERE bc.user_id = '<user_id_b>'
ON CONFLICT (stripe_subscription_id) DO UPDATE
SET trial_ends_at = NOW() + INTERVAL '2 days',
    status = 'trialing',
    current_period_end = NOW() + INTERVAL '2 days';

-- ============================================
-- User C: Day 13 (1 day remaining - no reminder)
-- ============================================
INSERT INTO billing_customers (user_id, stripe_customer_id, currency)
VALUES ('<user_id_c>', 'cus_test_day13', 'usd')
ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = 'cus_test_day13';

INSERT INTO billing_subscriptions (
  billing_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  status,
  current_period_end,
  trial_ends_at,
  metadata
)
SELECT 
  bc.id,
  'sub_test_day13',
  'price_test',
  'trialing',
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '1 day',
  '{"plan_name": "Standard", "plan_type": "standard", "interval": "month"}'::jsonb
FROM billing_customers bc
WHERE bc.user_id = '<user_id_c>'
ON CONFLICT (stripe_subscription_id) DO UPDATE
SET trial_ends_at = NOW() + INTERVAL '1 day',
    status = 'trialing',
    current_period_end = NOW() + INTERVAL '1 day';

-- ============================================
-- User D: Day 14 (0 days remaining - Day 14 reminder)
-- ============================================
INSERT INTO billing_customers (user_id, stripe_customer_id, currency)
VALUES ('<user_id_d>', 'cus_test_day14', 'usd')
ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = 'cus_test_day14';

INSERT INTO billing_subscriptions (
  billing_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  status,
  current_period_end,
  trial_ends_at,
  metadata
)
SELECT 
  bc.id,
  'sub_test_day14',
  'price_test',
  'trialing',
  CURRENT_DATE + INTERVAL '1 day',
  CURRENT_DATE,
  '{"plan_name": "Standard", "plan_type": "standard", "interval": "month"}'::jsonb
FROM billing_customers bc
WHERE bc.user_id = '<user_id_d>'
ON CONFLICT (stripe_subscription_id) DO UPDATE
SET trial_ends_at = CURRENT_DATE,
    status = 'trialing',
    current_period_end = CURRENT_DATE + INTERVAL '1 day';

-- ============================================
-- User E: Day 15 (Grace Period Day 1)
-- ============================================
INSERT INTO billing_customers (user_id, stripe_customer_id, currency)
VALUES ('<user_id_e>', 'cus_test_day15', 'usd')
ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = 'cus_test_day15';

INSERT INTO billing_subscriptions (
  billing_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  status,
  current_period_end,
  trial_ends_at,
  metadata
)
SELECT 
  bc.id,
  'sub_test_day15',
  'price_test',
  'canceled',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day',
  '{"plan_name": "Standard", "plan_type": "standard", "interval": "month"}'::jsonb
FROM billing_customers bc
WHERE bc.user_id = '<user_id_e>'
ON CONFLICT (stripe_subscription_id) DO UPDATE
SET trial_ends_at = NOW() - INTERVAL '1 day',
    status = 'canceled',
    current_period_end = NOW() - INTERVAL '1 day';

-- ============================================
-- User F: Day 17 (Grace Period Day 3)
-- ============================================
INSERT INTO billing_customers (user_id, stripe_customer_id, currency)
VALUES ('<user_id_f>', 'cus_test_day17', 'usd')
ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = 'cus_test_day17';

INSERT INTO billing_subscriptions (
  billing_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  status,
  current_period_end,
  trial_ends_at,
  metadata
)
SELECT 
  bc.id,
  'sub_test_day17',
  'price_test',
  'canceled',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days',
  '{"plan_name": "Standard", "plan_type": "standard", "interval": "month"}'::jsonb
FROM billing_customers bc
WHERE bc.user_id = '<user_id_f>'
ON CONFLICT (stripe_subscription_id) DO UPDATE
SET trial_ends_at = NOW() - INTERVAL '3 days',
    status = 'canceled',
    current_period_end = NOW() - INTERVAL '3 days';

-- ============================================
-- User G: Day 21 (Grace Period Day 7 - Last Day)
-- ============================================
INSERT INTO billing_customers (user_id, stripe_customer_id, currency)
VALUES ('<user_id_g>', 'cus_test_day21', 'usd')
ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = 'cus_test_day21';

INSERT INTO billing_subscriptions (
  billing_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  status,
  current_period_end,
  trial_ends_at,
  metadata
)
SELECT 
  bc.id,
  'sub_test_day21',
  'price_test',
  'canceled',
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '7 days',
  '{"plan_name": "Standard", "plan_type": "standard", "interval": "month"}'::jsonb
FROM billing_customers bc
WHERE bc.user_id = '<user_id_g>'
ON CONFLICT (stripe_subscription_id) DO UPDATE
SET trial_ends_at = NOW() - INTERVAL '7 days',
    status = 'canceled',
    current_period_end = NOW() - INTERVAL '7 days';

-- ============================================
-- User H: Day 22+ (Past Grace Period)
-- ============================================
INSERT INTO billing_customers (user_id, stripe_customer_id, currency)
VALUES ('<user_id_h>', 'cus_test_day22', 'usd')
ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = 'cus_test_day22';

INSERT INTO billing_subscriptions (
  billing_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  status,
  current_period_end,
  trial_ends_at,
  metadata
)
SELECT 
  bc.id,
  'sub_test_day22',
  'price_test',
  'canceled',
  NOW() - INTERVAL '8 days',
  NOW() - INTERVAL '8 days',
  '{"plan_name": "Standard", "plan_type": "standard", "interval": "month"}'::jsonb
FROM billing_customers bc
WHERE bc.user_id = '<user_id_h>'
ON CONFLICT (stripe_subscription_id) DO UPDATE
SET trial_ends_at = NOW() - INTERVAL '8 days',
    status = 'canceled',
    current_period_end = NOW() - INTERVAL '8 days';

-- ============================================
-- User I: Active Subscription (Control)
-- ============================================
INSERT INTO billing_customers (user_id, stripe_customer_id, currency)
VALUES ('<user_id_i>', 'cus_test_active', 'usd')
ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = 'cus_test_active';

INSERT INTO billing_subscriptions (
  billing_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  status,
  current_period_end,
  trial_ends_at,
  metadata
)
SELECT 
  bc.id,
  'sub_test_active',
  'price_test',
  'active',
  NOW() + INTERVAL '30 days',
  NULL,
  '{"plan_name": "Standard", "plan_type": "standard", "interval": "month"}'::jsonb
FROM billing_customers bc
WHERE bc.user_id = '<user_id_i>'
ON CONFLICT (stripe_subscription_id) DO UPDATE
SET status = 'active',
    trial_ends_at = NULL,
    current_period_end = NOW() + INTERVAL '30 days';

-- ============================================
-- User J: Past Due (For Paywall Variant Testing)
-- ============================================
INSERT INTO billing_customers (user_id, stripe_customer_id, currency)
VALUES ('<user_id_j>', 'cus_test_past_due', 'usd')
ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = 'cus_test_past_due';

INSERT INTO billing_subscriptions (
  billing_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  status,
  current_period_end,
  trial_ends_at,
  metadata
)
SELECT 
  bc.id,
  'sub_test_past_due',
  'price_test',
  'past_due',
  NOW() - INTERVAL '5 days',
  NULL,
  '{"plan_name": "Standard", "plan_type": "standard", "interval": "month"}'::jsonb
FROM billing_customers bc
WHERE bc.user_id = '<user_id_j>'
ON CONFLICT (stripe_subscription_id) DO UPDATE
SET status = 'past_due',
    current_period_end = NOW() - INTERVAL '5 days';

-- ============================================
-- QUICK UPDATE SCRIPTS (For Testing Different States)
-- ============================================

-- Update existing user to Day 12 (for reminder testing)
-- UPDATE billing_subscriptions 
-- SET trial_ends_at = NOW() + INTERVAL '2 days',
--     status = 'trialing'
-- WHERE billing_customer_id = (SELECT id FROM billing_customers WHERE user_id = '<user_id>');

-- Update existing user to Day 14 (for reminder testing)
-- UPDATE billing_subscriptions 
-- SET trial_ends_at = CURRENT_DATE,
--     status = 'trialing'
-- WHERE billing_customer_id = (SELECT id FROM billing_customers WHERE user_id = '<user_id>');

-- Update existing user to Grace Period Day 3
-- UPDATE billing_subscriptions 
-- SET trial_ends_at = NOW() - INTERVAL '3 days',
--     status = 'canceled'
-- WHERE billing_customer_id = (SELECT id FROM billing_customers WHERE user_id = '<user_id>');

-- Update existing user to Past Grace Period
-- UPDATE billing_subscriptions 
-- SET trial_ends_at = NOW() - INTERVAL '8 days',
--     status = 'canceled'
-- WHERE billing_customer_id = (SELECT id FROM billing_customers WHERE user_id = '<user_id>');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check user's subscription status
-- SELECT 
--   u.email,
--   bs.status,
--   bs.trial_ends_at,
--   CASE 
--     WHEN bs.trial_ends_at IS NULL THEN 'No trial'
--     WHEN bs.trial_ends_at > NOW() THEN CONCAT('Trial ends in ', CEIL(EXTRACT(EPOCH FROM (bs.trial_ends_at - NOW())) / 86400), ' days')
--     WHEN bs.trial_ends_at > NOW() - INTERVAL '7 days' THEN CONCAT('Grace period: ', CEIL(EXTRACT(EPOCH FROM (NOW() - bs.trial_ends_at)) / 86400), ' days in')
--     ELSE 'Past grace period'
--   END as trial_state
-- FROM users u
-- LEFT JOIN billing_customers bc ON bc.user_id = u.id
-- LEFT JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
-- WHERE u.email = '<email>'
-- ORDER BY bs.created_at DESC
-- LIMIT 1;

