-- Add recommended action fields to email_metadata table
-- Part of NEX-42: AI-Powered Email Signal Extraction

ALTER TABLE email_metadata
  ADD COLUMN IF NOT EXISTS recommended_action_type TEXT CHECK (recommended_action_type IN ('OUTREACH', 'FOLLOW_UP', 'NURTURE', 'CALL_PREP', 'POST_CALL', 'CONTENT', 'FAST_WIN')),
  ADD COLUMN IF NOT EXISTS recommended_action_description TEXT,
  ADD COLUMN IF NOT EXISTS recommended_due_date DATE;

-- Add index for recommended action type
CREATE INDEX IF NOT EXISTS idx_email_metadata_recommended_action ON email_metadata(recommended_action_type) WHERE recommended_action_type IS NOT NULL;

-- Add comments
COMMENT ON COLUMN email_metadata.recommended_action_type IS 'AI-recommended action type based on email content and attachments. Automatically creates action if enabled.';
COMMENT ON COLUMN email_metadata.recommended_action_description IS 'AI-generated description for the recommended follow-up action (e.g., "Follow up with sender on topic X").';
COMMENT ON COLUMN email_metadata.recommended_due_date IS 'AI-suggested due date for the recommended action based on email urgency and context.';

