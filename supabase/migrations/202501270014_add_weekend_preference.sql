-- Add weekend preference to users table
-- This allows users to specify if weekends (Saturday/Sunday) should be excluded from action planning

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS exclude_weekends BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN users.exclude_weekends IS 'If true, weekends (Saturday/Sunday) are excluded from daily plan generation';



