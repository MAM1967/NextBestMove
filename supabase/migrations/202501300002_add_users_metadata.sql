-- Add metadata column to users table for streak notification tracking
-- This allows us to track which streak recovery notifications have been sent

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for metadata queries (optional, but helpful for performance)
CREATE INDEX IF NOT EXISTS idx_users_metadata ON users USING GIN (metadata);

-- Add comment
COMMENT ON COLUMN users.metadata IS 'JSON metadata for tracking notifications, preferences, and other user-specific data';

