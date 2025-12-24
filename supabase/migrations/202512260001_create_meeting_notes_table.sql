-- 202512260001_create_meeting_notes_table.sql
-- Creates meeting_notes table for storing meeting notes/transcripts
-- and extracted action items/insights

CREATE TYPE extraction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'needs_review');

CREATE TABLE meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL, -- Raw meeting notes/transcript
  extracted_insights TEXT, -- AI-extracted insights (stored as text, can be JSON in future)
  extraction_status extraction_status NOT NULL DEFAULT 'pending',
  extraction_confidence TEXT, -- 'high', 'medium', 'low' stored as text for flexibility
  extracted_at TIMESTAMPTZ, -- When extraction was completed
  error_message TEXT, -- Error message if extraction failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_meeting_notes_user_id ON meeting_notes(user_id);
CREATE INDEX idx_meeting_notes_lead_id ON meeting_notes(lead_id);
CREATE INDEX idx_meeting_notes_status ON meeting_notes(extraction_status);
CREATE INDEX idx_meeting_notes_lead_created ON meeting_notes(lead_id, created_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_meeting_notes_updated_at
  BEFORE UPDATE ON meeting_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add meeting_note_id to actions table to track which actions came from meeting notes
ALTER TABLE actions
ADD COLUMN IF NOT EXISTS meeting_note_id UUID REFERENCES meeting_notes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_actions_meeting_note_id ON actions(meeting_note_id);

-- RLS Policies
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own meeting notes
CREATE POLICY "Users can view their own meeting notes"
  ON meeting_notes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own meeting notes
CREATE POLICY "Users can insert their own meeting notes"
  ON meeting_notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own meeting notes
CREATE POLICY "Users can update their own meeting notes"
  ON meeting_notes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own meeting notes
CREATE POLICY "Users can delete their own meeting notes"
  ON meeting_notes
  FOR DELETE
  USING (auth.uid() = user_id);

