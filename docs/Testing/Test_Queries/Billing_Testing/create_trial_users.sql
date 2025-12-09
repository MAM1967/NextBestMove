-- Create Trial Users - Template
-- Use this to set up users in different trial states
-- Based on Group1_Test_Data_Setup.sql
-- Replace <user_id> and <email> with actual test user values

-- ============================================
-- User: Day 11 (3 days remaining - no reminder)
-- ============================================
INSERT INTO billing_customers (user_id, stripe_customer_id, currency)
VALUES ('<user_id>', 'cus_test_day11', 'usd')
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
WHERE bc.user_id = '<user_id>'
ON CONFLICT (stripe_subscription_id) DO UPDATE
SET trial_ends_at = NOW() + INTERVAL '3 days',
    status = 'trialing',
    current_period_end = NOW() + INTERVAL '3 days';

-- ============================================
-- User: Day 12 (2 days remaining - Day 12 reminder)
-- ============================================
-- Copy the pattern above and adjust:
-- - trial_ends_at = NOW() + INTERVAL '2 days'
-- - current_period_end = NOW() + INTERVAL '2 days'

-- ============================================
-- User: Day 13 (1 day remaining - no reminder)
-- ============================================
-- Copy the pattern above and adjust:
-- - trial_ends_at = NOW() + INTERVAL '1 day'
-- - current_period_end = NOW() + INTERVAL '1 day'

-- ============================================
-- User: Day 14 (trial ends today)
-- ============================================
-- Copy the pattern above and adjust:
-- - trial_ends_at = NOW()
-- - current_period_end = NOW()
-- - status = 'active' (if converting) or 'canceled' (if ending)

