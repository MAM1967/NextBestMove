-- Add action completion tracking fields
-- NEX-51: Actions Page Improvements - Action completion tracking

ALTER TABLE actions
  ADD COLUMN IF NOT EXISTS next_call_calendared_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS replied_to_email_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS got_response_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS got_response_notes TEXT;

-- Add comments
COMMENT ON COLUMN actions.next_call_calendared_at IS 'Timestamp when user marked "Next call calendared" - records concrete event that a call was scheduled.';
COMMENT ON COLUMN actions.replied_to_email_at IS 'Timestamp when user marked "Replied to email with topics" - records concrete event that an email reply was sent.';
COMMENT ON COLUMN actions.got_response_at IS 'Timestamp when user marked "Got response" - records concrete event that a response was received.';
COMMENT ON COLUMN actions.got_response_notes IS 'Notes associated with the response received, captured when marking "Got response".';

