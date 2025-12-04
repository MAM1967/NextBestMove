-- Force remove downgrade_warning_shown from metadata
-- Using jsonb operator to completely remove the key

UPDATE billing_subscriptions
SET 
  metadata = metadata - 'downgrade_warning_shown',
  updated_at = NOW()
WHERE id = '2cfd76c5-e45e-4105-9297-554b3244ea98';

-- Verify it's gone
SELECT 
  'Verification' as check_type,
  bs.id,
  bs.metadata->>'downgrade_warning_shown' as warning_shown,
  bs.metadata ? 'downgrade_warning_shown' as key_exists,
  bs.metadata::text as full_metadata
FROM billing_subscriptions bs
WHERE bs.id = '2cfd76c5-e45e-4105-9297-554b3244ea98';
-- key_exists should be false, warning_shown should be NULL

