-- Add capacity override fields to daily_plans table
ALTER TABLE daily_plans 
ADD COLUMN IF NOT EXISTS capacity_override capacity_level,
ADD COLUMN IF NOT EXISTS override_reason TEXT; -- Optional: 'busy', 'light', 'manual'

-- Add default capacity preference to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS default_capacity_override capacity_level;

-- Add comment explaining the override fields
COMMENT ON COLUMN daily_plans.capacity_override IS 'Manual capacity override for a specific day. Takes precedence over calendar-based calculation and user default.';
COMMENT ON COLUMN daily_plans.override_reason IS 'Reason for the override: busy, light, or manual user selection.';
COMMENT ON COLUMN users.default_capacity_override IS 'User preference for default daily capacity. Used when no calendar data is available and no daily override is set.';

