-- Add comprehensive email signal fields to email_metadata table
-- Enhanced AI-powered email signal extraction with thread summaries, categories, topics, attachments, links, and relationship signals

ALTER TABLE email_metadata
  ADD COLUMN IF NOT EXISTS thread_summary_1l TEXT,
  ADD COLUMN IF NOT EXISTS thread_summary_detail TEXT,
  ADD COLUMN IF NOT EXISTS primary_category TEXT,
  ADD COLUMN IF NOT EXISTS secondary_categories TEXT[],
  ADD COLUMN IF NOT EXISTS topics_comprehensive TEXT[], -- Enhanced topics (separate from last_topic for backward compatibility)
  ADD COLUMN IF NOT EXISTS proposed_tiers JSONB, -- Array of {tier: string, size: number}
  ADD COLUMN IF NOT EXISTS asks_from_sender TEXT[], -- Enhanced asks (separate from ask for backward compatibility)
  ADD COLUMN IF NOT EXISTS value_to_capture TEXT[],
  ADD COLUMN IF NOT EXISTS suggested_next_actions TEXT[],
  ADD COLUMN IF NOT EXISTS attachments JSONB, -- Array of {filename: string, type: string, reason: string}
  ADD COLUMN IF NOT EXISTS links JSONB, -- Array of {url: string, label: string}
  ADD COLUMN IF NOT EXISTS relationship_signal JSONB; -- {signal_type: string, strength: string, evidence: string[]}

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_email_metadata_primary_category ON email_metadata(primary_category) WHERE primary_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_metadata_topics_comprehensive ON email_metadata USING GIN(topics_comprehensive) WHERE topics_comprehensive IS NOT NULL;

-- Add comments
COMMENT ON COLUMN email_metadata.thread_summary_1l IS 'One-line summary of email thread for quick reference';
COMMENT ON COLUMN email_metadata.thread_summary_detail IS 'Detailed summary of email thread with context and key points';
COMMENT ON COLUMN email_metadata.primary_category IS 'Primary category classification (e.g., Product feedback, Meeting request)';
COMMENT ON COLUMN email_metadata.secondary_categories IS 'Additional category tags for better organization';
COMMENT ON COLUMN email_metadata.topics_comprehensive IS 'Comprehensive list of topics discussed in the email';
COMMENT ON COLUMN email_metadata.proposed_tiers IS 'Any tier structures or frameworks mentioned in the email';
COMMENT ON COLUMN email_metadata.asks_from_sender IS 'Enhanced list of asks, questions, or requests from sender';
COMMENT ON COLUMN email_metadata.value_to_capture IS 'Key information or insights to capture from the email';
COMMENT ON COLUMN email_metadata.suggested_next_actions IS 'AI-suggested next actions based on email content';
COMMENT ON COLUMN email_metadata.attachments IS 'List of attachments with metadata (filename, type, reason)';
COMMENT ON COLUMN email_metadata.links IS 'List of links mentioned in email with labels';
COMMENT ON COLUMN email_metadata.relationship_signal IS 'Relationship signal strength and type (signal_type, strength, evidence)';

