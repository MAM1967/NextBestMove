-- Debug Billing Portal Issue for Past Due User
-- Check if user has valid Stripe customer ID

-- Step 1: Check if billing_customer exists with valid Stripe customer ID
SELECT 
  'Billing Customer Check' as check_type,
  u.email,
  u.id as user_id,
  bc.id as billing_customer_id,
  bc.stripe_customer_id,
  CASE 
    WHEN bc.stripe_customer_id IS NULL THEN '❌ Missing Stripe customer ID'
    WHEN bc.stripe_customer_id NOT LIKE 'cus_%' THEN CONCAT('❌ Invalid format: ', bc.stripe_customer_id)
    ELSE '✅ Valid Stripe customer ID'
  END as customer_status
FROM users u
LEFT JOIN billing_customers bc ON bc.user_id = u.id
WHERE u.id = 'YOUR_USER_ID_HERE';

-- Step 2: Check subscription status
SELECT 
  'Subscription Check' as check_type,
  bs.status,
  bs.stripe_subscription_id,
  CASE 
    WHEN bs.stripe_subscription_id IS NULL THEN '❌ Missing Stripe subscription ID'
    WHEN bs.stripe_subscription_id NOT LIKE 'sub_%' THEN CONCAT('❌ Invalid format: ', bs.stripe_subscription_id)
    ELSE '✅ Valid Stripe subscription ID'
  END as subscription_status
FROM billing_subscriptions bs
WHERE bs.billing_customer_id = (
  SELECT id FROM billing_customers 
  WHERE user_id = 'YOUR_USER_ID_HERE'
)
ORDER BY bs.created_at DESC
LIMIT 1;

-- Step 3: Fix - Ensure user has valid Stripe customer ID
-- If the user was created manually for testing, they might not have a real Stripe customer
-- You need to either:
-- A) Create a real Stripe customer via checkout flow, OR
-- B) Use a test Stripe customer ID from Stripe Dashboard

-- Option A: Create via checkout (recommended for testing)
-- 1. Set subscription status back to 'none' or 'trialing'
-- 2. Go through the checkout flow to create a real Stripe customer
-- 3. Then set status back to 'past_due' for testing

-- Option B: Use test customer ID (for quick testing)
-- Replace 'cus_test_xxxxx' with a real test customer ID from Stripe Dashboard
/*
UPDATE billing_customers 
SET stripe_customer_id = 'cus_test_xxxxx'  -- Replace with real test customer ID
WHERE user_id = 'YOUR_USER_ID_HERE';
*/

