-- 202512040005_add_pre_call_briefs.sql
-- Professional plan Phase 2: Pre-Call Briefs
-- Adds pre_call_briefs table for storing auto-generated call preparation briefs

BEGIN;

CREATE TABLE IF NOT EXISTS pre_call_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  calendar_event_id TEXT, -- External calendar event ID
  event_title TEXT,
  event_start TIMESTAMPTZ NOT NULL,
  person_pin_id UUID REFERENCES person_pins(id) ON DELETE SET NULL,
  brief_content TEXT NOT NULL, -- Generated brief
  last_interaction_date DATE,
  follow_up_count INTEGER DEFAULT 0,
  next_step_suggestions TEXT[], -- Array of suggestions
  user_notes TEXT, -- Aggregated notes from actions
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pre_call_briefs_user_id ON pre_call_briefs(user_id);
CREATE INDEX IF NOT EXISTS idx_pre_call_briefs_event_start ON pre_call_briefs(event_start);
CREATE INDEX IF NOT EXISTS idx_pre_call_briefs_person_pin_id ON pre_call_briefs(person_pin_id);
CREATE INDEX IF NOT EXISTS idx_pre_call_briefs_user_event_start ON pre_call_briefs(user_id, event_start);

-- Trigger to update updated_at
CREATE TRIGGER update_pre_call_briefs_updated_at
  BEFORE UPDATE ON pre_call_briefs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;

