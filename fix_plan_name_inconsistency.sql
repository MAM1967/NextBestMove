-- Fix plan_name inconsistency - should be "Standard" not "Premium" for standard plan
UPDATE billing_subscriptions
SET metadata = jsonb_set(
  metadata,
  '{plan_name}',
  '"Standard"'
)
WHERE id = '2cfd76c5-e45e-4105-9297-554b3244ea98'
  AND metadata->>'plan_type' = 'standard'
  AND metadata->>'plan_name' != 'Standard';

-- Verify
SELECT 
  'Fixed Metadata' as check_type,
  bs.metadata->>'plan_type' as plan_type,
  bs.metadata->>'plan_name' as plan_name
FROM billing_subscriptions bs
WHERE bs.id = '2cfd76c5-e45e-4105-9297-554b3244ea98';
-- Should show plan_type: 'standard', plan_name: 'Standard'

