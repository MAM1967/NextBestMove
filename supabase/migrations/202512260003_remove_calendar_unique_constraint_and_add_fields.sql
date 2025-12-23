-- Migration: Remove unique constraint on calendar_connections to allow multiple calendars per user/provider
-- Add calendar_name and account_email fields for better user identification

-- Remove unique constraint to allow multiple calendars per provider
ALTER TABLE calendar_connections
  DROP CONSTRAINT IF EXISTS calendar_connections_user_id_provider_key;

-- Add calendar_name field for user identification (optional)
ALTER TABLE calendar_connections
  ADD COLUMN IF NOT EXISTS calendar_name TEXT;

-- Add account_email field to show which account the calendar belongs to (optional)
ALTER TABLE calendar_connections
  ADD COLUMN IF NOT EXISTS account_email TEXT;

-- Create index for faster queries on active connections
CREATE INDEX IF NOT EXISTS idx_calendar_connections_user_status 
ON calendar_connections(user_id, status) 
WHERE status = 'active';

-- Add comment explaining the change
COMMENT ON COLUMN calendar_connections.calendar_name IS 'Optional user-friendly name for the calendar (e.g., "Work Calendar", "Personal Calendar")';
COMMENT ON COLUMN calendar_connections.account_email IS 'Email address associated with the calendar account (e.g., "work@company.com")';

