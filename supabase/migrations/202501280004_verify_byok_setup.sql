-- Verify BYOK setup for a user
-- Replace email with your email

SELECT 
  u.email,
  u.ai_provider,
  u.ai_model,
  CASE 
    WHEN u.ai_api_key_encrypted IS NOT NULL THEN 'Key saved (encrypted)'
    ELSE 'No key saved'
  END as key_status,
  LENGTH(u.ai_api_key_encrypted) as encrypted_key_length
FROM users u
WHERE u.email = 'mcddsl+test1@gmail.com'; -- CHANGE THIS EMAIL

-- Also check subscription status
SELECT 
  u.email,
  bs.status as subscription_status,
  bs.metadata->>'plan_type' as plan_type,
  bs.metadata->>'plan_name' as plan_name
FROM users u
JOIN billing_customers bc ON bc.user_id = u.id
JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.email = 'mcddsl+test1@gmail.com' -- CHANGE THIS EMAIL
  AND bs.status IN ('active', 'trialing')
ORDER BY bs.created_at DESC
LIMIT 1;

