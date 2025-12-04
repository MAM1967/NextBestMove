-- Test 5.5: Day 7 Skip (No Subscription) - Verification
-- Verify that NO email was sent and metadata was NOT updated

SELECT 
  email,
  streak_count,
  last_action_date,
  CURRENT_DATE - last_action_date as days_inactive,
  metadata->'streak_notifications'->>'day7_sent' as day7_sent,
  metadata->'streak_notifications'->>'last_day' as last_day,
  metadata->'streak_notifications' as notifications
FROM users
WHERE email = 'mcddsl+onboard1@gmail.com';

-- Expected results:
--   day7_sent: NULL (not set, because email was NOT sent)
--   last_day: NULL or previous value (not updated to 7)
--   days_inactive: 7

-- Also verify subscription status
SELECT 
  u.email,
  bs.status as subscription_status
FROM users u
LEFT JOIN billing_customers bc ON bc.user_id = u.id
LEFT JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.email = 'mcddsl+onboard1@gmail.com'
ORDER BY bs.created_at DESC
LIMIT 1;
-- Expected: subscription_status = NULL or 'canceled' or 'past_due' (NOT 'active' or 'trialing')

