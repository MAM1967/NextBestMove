-- Reset downgrade warning flag on BOTH subscriptions
-- There are 2 subscriptions: one active, one trialing

UPDATE billing_subscriptions
SET metadata = metadata - 'downgrade_warning_shown'
WHERE id IN (
  '2cfd76c5-e45e-4105-9297-554b3244ea98',  -- active
  '4f490075-40ab-4c58-9f4d-b45da97ac36f'   -- trialing
);

-- Verify both are reset
SELECT 
  bs.id,
  bs.status,
  bs.metadata->>'downgrade_warning_shown' as warning_shown,
  bs.metadata->>'downgrade_detected_at' as downgrade_detected_at
FROM billing_subscriptions bs
WHERE bs.id IN (
  '2cfd76c5-e45e-4105-9297-554b3244ea98',
  '4f490075-40ab-4c58-9f4d-b45da97ac36f'
);
-- Both should show warning_shown: NULL

