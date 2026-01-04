-- Add action source attribution fields
-- NEX-56: Actions Page Redesign - Source Attribution

-- Create enum types
CREATE TYPE action_source AS ENUM ('email', 'linkedin', 'calendar', 'meeting_note', 'manual', 'system');
CREATE TYPE action_intent_type AS ENUM ('follow_up', 'reply', 'schedule', 'review', 'outreach', 'nurture');

-- Add columns to actions table
ALTER TABLE actions
  ADD COLUMN source action_source NOT NULL DEFAULT 'manual',
  ADD COLUMN source_ref TEXT,
  ADD COLUMN intent_type action_intent_type;

-- Create indexes for filtering
CREATE INDEX idx_actions_source ON actions(source);
CREATE INDEX idx_actions_intent_type ON actions(intent_type);
CREATE INDEX idx_actions_user_source ON actions(user_id, source);

-- Backfill existing data
UPDATE actions SET source = 'system' WHERE auto_created = true;
UPDATE actions SET source = 'manual' WHERE auto_created = false;

-- Add comments
COMMENT ON COLUMN actions.source IS 'Source of the action: email, linkedin, calendar, meeting_note, manual, or system';
COMMENT ON COLUMN actions.source_ref IS 'Reference to the source record (e.g., email_metadata_id, calendar_event_id, meeting_note_id)';
COMMENT ON COLUMN actions.intent_type IS 'Intent/purpose of the action: follow_up, reply, schedule, review, outreach, or nurture';

