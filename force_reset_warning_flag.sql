-- Force reset downgrade warning flag by removing the key entirely
-- This subscription ID is from the debug query: 2cfd76c5-e45e-4105-9297-554b3244ea98

UPDATE billing_subscriptions
SET metadata = metadata - 'downgrade_warning_shown'
WHERE id = '2cfd76c5-e45e-4105-9297-554b3244ea98';

-- Verify it's removed
SELECT 
  'After Reset' as check_type,
  bs.id,
  bs.status,
  bs.metadata->>'plan_type' as plan_type,
  bs.metadata->>'downgrade_warning_shown' as warning_shown,
  bs.metadata->>'downgrade_detected_at' as downgrade_detected_at,
  bs.metadata->>'downgrade_pin_count' as downgrade_pin_count
FROM billing_subscriptions bs
WHERE bs.id = '2cfd76c5-e45e-4105-9297-554b3244ea98';
-- Should show warning_shown: NULL

