-- 202512270001_remove_calendar_connection_unique_constraint.sql
-- Remove UNIQUE constraint on (user_id, provider) to allow multiple calendar connections
-- Add display_name field to help identify multiple connections

-- Drop the unique constraint
ALTER TABLE calendar_connections
DROP CONSTRAINT IF EXISTS calendar_connections_user_id_provider_key;

-- Add display_name field to help users identify multiple connections
-- This will be the email address or account identifier from the OAuth provider
ALTER TABLE calendar_connections
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add index for faster queries by user and status
CREATE INDEX IF NOT EXISTS idx_calendar_connections_user_status_active 
ON calendar_connections(user_id, status) 
WHERE status = 'active';

-- Update existing connections to have display_name (can be backfilled later)
-- For now, we'll set it to a default value if it's null

