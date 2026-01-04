-- Add AI-powered email analysis fields to email_metadata table
-- NEX-42: AI-Powered Email Signal Extraction

ALTER TABLE email_metadata
  ADD COLUMN IF NOT EXISTS full_body TEXT,
  ADD COLUMN IF NOT EXISTS sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'urgent')),
  ADD COLUMN IF NOT EXISTS intent TEXT CHECK (intent IN ('question', 'request', 'follow_up', 'introduction', 'meeting_request', 'proposal', 'complaint', 'other'));

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_email_metadata_sentiment ON email_metadata(sentiment) WHERE sentiment IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_metadata_intent ON email_metadata(intent) WHERE intent IS NOT NULL;

-- Add comments
COMMENT ON COLUMN email_metadata.full_body IS 'Full email body text (HTML stripped). Used for AI-powered signal extraction.';
COMMENT ON COLUMN email_metadata.sentiment IS 'AI-extracted sentiment: positive, neutral, negative, or urgent. Used in decision engine scoring.';
COMMENT ON COLUMN email_metadata.intent IS 'AI-extracted intent classification: question, request, follow_up, introduction, meeting_request, proposal, complaint, or other. Used for action type suggestions.';

