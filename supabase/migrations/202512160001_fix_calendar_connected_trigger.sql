-- Fix calendar_connected trigger to handle DELETE operations
-- The original trigger only handled INSERT/UPDATE (NEW) but not DELETE (OLD)
-- This caused the calendar_connected flag to not update when connections were deleted

CREATE OR REPLACE FUNCTION update_user_calendar_status()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Determine which user_id to use based on operation type
  IF TG_OP = 'DELETE' THEN
    target_user_id := OLD.user_id;
  ELSE
    target_user_id := NEW.user_id;
  END IF;

  -- Update the calendar_connected flag based on whether any active connections exist
  UPDATE users
  SET calendar_connected = EXISTS (
    SELECT 1 FROM calendar_connections
    WHERE user_id = target_user_id
      AND status = 'active'
  )
  WHERE id = target_user_id;

  -- Return appropriate value based on operation type
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

