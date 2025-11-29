-- Add time format preference to users table
-- Users can choose between 12-hour (AM/PM) or 24-hour format for display
-- Storage remains in 24-hour format (TIME type)

ALTER TABLE users
ADD COLUMN IF NOT EXISTS time_format_preference TEXT DEFAULT '24h' CHECK (time_format_preference IN ('12h', '24h'));

-- Update existing users to have default 24-hour format
UPDATE users
SET time_format_preference = '24h'
WHERE time_format_preference IS NULL;

