-- Group 2 Phase 1 Test: Day 0 Payment Failure Email
-- This test verifies the webhook sends an email immediately when payment fails

-- Step 1: Find your test user ID
-- Replace 'mcddsl@icloud.com' with your test user email
SELECT 
  u.id as user_id,
  u.email,
  bc.id as billing_customer_id,
  bs.id as subscription_id,
  bs.status,
  bs.payment_failed_at,
  bs.current_period_end
FROM users u
LEFT JOIN billing_customers bc ON bc.user_id = u.id
LEFT JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.email = 'mcddsl@icloud.com'
ORDER BY bs.created_at DESC
LIMIT 1;

-- Step 2: Set up payment failure state (Day 0)
-- Replace '<your_test_user_id>' with the user_id from Step 1
-- IMPORTANT: Set payment_failed_at to NULL first so webhook can detect first failure
UPDATE billing_subscriptions
SET status = 'past_due',
    payment_failed_at = NULL,  -- Reset to NULL so webhook detects first failure
    current_period_end = NOW() + INTERVAL '30 days'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers
  WHERE user_id = '<your_test_user_id>'
);

-- Step 3: Verify the state
SELECT 
  u.email,
  bs.status,
  bs.payment_failed_at,
  bs.current_period_end,
  CASE 
    WHEN bs.payment_failed_at IS NULL THEN 'Ready for webhook (first failure)'
    ELSE 'Already has payment failure'
  END as test_state
FROM users u
JOIN billing_customers bc ON bc.user_id = u.id
JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.email = 'mcddsl@icloud.com'
ORDER BY bs.created_at DESC
LIMIT 1;

