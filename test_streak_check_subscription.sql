-- Quick check: Does the test user have an active subscription?
SELECT 
  u.email,
  bs.status as subscription_status,
  bs.stripe_subscription_id,
  CASE 
    WHEN bs.status IN ('active', 'trialing') THEN 'HAS active subscription - need to cancel for Test 5.5'
    WHEN bs.status IN ('canceled', 'past_due') THEN 'NO active subscription - ready for Test 5.5'
    WHEN bs.status IS NULL THEN 'NO subscription - ready for Test 5.5'
    ELSE 'Unknown status'
  END as test_readiness
FROM users u
LEFT JOIN billing_customers bc ON bc.user_id = u.id
LEFT JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.email = 'mcddsl+onboard1@gmail.com'
ORDER BY bs.created_at DESC
LIMIT 1;

