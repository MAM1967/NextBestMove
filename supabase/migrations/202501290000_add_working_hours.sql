-- Add working hours columns to users table
-- These store the user's preferred working hours (0-23 for hour of day)
-- Default to 9 AM - 5 PM (9 and 17) for existing users

ALTER TABLE users
ADD COLUMN IF NOT EXISTS work_start_hour INTEGER DEFAULT 9 CHECK (work_start_hour >= 0 AND work_start_hour <= 23),
ADD COLUMN IF NOT EXISTS work_end_hour INTEGER DEFAULT 17 CHECK (work_end_hour >= 0 AND work_end_hour <= 23);

-- Update existing users to have default 9-5 hours if they don't have them set
UPDATE users
SET work_start_hour = 9, work_end_hour = 17
WHERE work_start_hour IS NULL OR work_end_hour IS NULL;

-- Add constraint to ensure end hour is after start hour (after updating existing users)
ALTER TABLE users
ADD CONSTRAINT work_hours_valid CHECK (work_end_hour > work_start_hour);

