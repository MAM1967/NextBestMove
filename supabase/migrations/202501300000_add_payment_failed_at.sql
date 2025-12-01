-- Add payment_failed_at field to track when payment failures occur
-- Used for payment failure recovery flow (Day 0, 3, 7, 14)

ALTER TABLE billing_subscriptions
ADD COLUMN IF NOT EXISTS payment_failed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_payment_failed_at 
ON billing_subscriptions(payment_failed_at) 
WHERE payment_failed_at IS NOT NULL;

-- Add comment
COMMENT ON COLUMN billing_subscriptions.payment_failed_at IS 
'Timestamp when payment first failed. Used for recovery flow: Day 0 email, Day 3 modal+email, Day 7 read-only, Day 14 archive.';

