-- Update cancellation_feedback table to support analytics
-- Add subscription_id and rename reason to cancellation_reason for clarity

ALTER TABLE cancellation_feedback
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES billing_subscriptions(id),
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Migrate existing reason data to cancellation_reason
UPDATE cancellation_feedback
SET cancellation_reason = reason
WHERE cancellation_reason IS NULL AND reason IS NOT NULL;

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_reason ON cancellation_feedback(cancellation_reason);
CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_subscription ON cancellation_feedback(subscription_id);

-- Add admin policy for viewing all feedback (service role only)
-- Note: This requires service role authentication, not regular user auth
DROP POLICY IF EXISTS "Admins can view all cancellation feedback" ON cancellation_feedback;

-- Service role can view all feedback (checked in application code)
-- RLS policies remain for regular users (can only see their own)

COMMENT ON COLUMN cancellation_feedback.cancellation_reason IS 'Reason for cancellation (e.g., too_expensive, not_useful, found_alternative)';
COMMENT ON COLUMN cancellation_feedback.subscription_id IS 'Reference to the subscription that was canceled';

