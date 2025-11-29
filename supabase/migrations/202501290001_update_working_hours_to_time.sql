-- Update working hours to use TIME type for precise HH:MM format
-- This allows entries like 9:30, 17:30, 19:25, etc.

-- First, drop the old integer columns and constraint
ALTER TABLE users
DROP CONSTRAINT IF EXISTS work_hours_valid,
DROP COLUMN IF EXISTS work_start_hour,
DROP COLUMN IF EXISTS work_end_hour;

-- Add new TIME columns (default to 09:00 and 17:00)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS work_start_time TIME DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS work_end_time TIME DEFAULT '17:00:00';

-- Update existing users to have default 9-5 hours
UPDATE users
SET work_start_time = '09:00:00', work_end_time = '17:00:00'
WHERE work_start_time IS NULL OR work_end_time IS NULL;

-- Add constraint to ensure end time is after start time
ALTER TABLE users
ADD CONSTRAINT work_hours_valid CHECK (work_end_time > work_start_time);

