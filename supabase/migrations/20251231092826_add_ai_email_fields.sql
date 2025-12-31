-- Add AI-powered email analysis fields to email_metadata table
-- NEX-42: AI-Powered Email Signal Extraction

ALTER TABLE email_metadata
  ADD COLUMN IF NOT EXISTS full_body TEXT,
  ADD COLUMN IF NOT EXISTS sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'urgent')),
  ADD COLUMN IF NOT EXISTS intent TEXT CHECK (intent IN ('question', 'request', 'follow_up', 'introduction', 'meeting_request', 'proposal', 'complaint', 'other')),
  ADD COLUMN IF NOT EXISTS recommended_action_type TEXT CHECK (recommended_action_type IN ('OUTREACH', 'FOLLOW_UP', 'NURTURE', 'CALL_PREP', 'POST_CALL', 'CONTENT', 'FAST_WIN')),
  ADD COLUMN IF NOT EXISTS recommended_action_description TEXT,
  ADD COLUMN IF NOT EXISTS recommended_due_date DATE;

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_email_metadata_sentiment ON email_metadata(sentiment) WHERE sentiment IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_metadata_intent ON email_metadata(intent) WHERE intent IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_metadata_recommended_action ON email_metadata(recommended_action_type) WHERE recommended_action_type IS NOT NULL;

-- Add comments
COMMENT ON COLUMN email_metadata.full_body IS 'Full email body text (HTML stripped). Used for AI-powered signal extraction.';
COMMENT ON COLUMN email_metadata.sentiment IS 'AI-extracted sentiment: positive, neutral, negative, or urgent. Used in decision engine scoring.';
COMMENT ON COLUMN email_metadata.intent IS 'AI-extracted intent classification: question, request, follow_up, introduction, meeting_request, proposal, complaint, or other. Used for action type suggestions.';
COMMENT ON COLUMN email_metadata.recommended_action_type IS 'AI-recommended action type based on email content and attachments. Automatically creates action if enabled.';
COMMENT ON COLUMN email_metadata.recommended_action_description IS 'AI-generated description for the recommended follow-up action (e.g., "Follow up with sender on topic X").';
COMMENT ON COLUMN email_metadata.recommended_due_date IS 'AI-suggested due date for the recommended action based on email urgency and context.';

