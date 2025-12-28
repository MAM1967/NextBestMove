-- 202512230002_add_user_tier_field.sql
-- Adds tier field to users table for Free/Standard/Premium tier system
-- Implements reverse trial model: all users start on Standard for 14 days, then downgrade to Free

BEGIN;

-- Step 1: Create tier enum
CREATE TYPE user_tier AS ENUM ('free', 'standard', 'premium');

-- Step 2: Add tier field to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS tier user_tier DEFAULT 'free';

-- Step 3: Create index for tier queries
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier) WHERE tier IS NOT NULL;

-- Step 4: Migration strategy for existing users
-- All existing users should be set to 'standard' if they have an active/trialing subscription
-- Otherwise set to 'free'
UPDATE users
SET tier = CASE
  WHEN EXISTS (
    SELECT 1
    FROM billing_customers bc
    JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
    WHERE bc.user_id = users.id
      AND bs.status IN ('trialing', 'active')
  ) THEN 'standard'::user_tier
  ELSE 'free'::user_tier
END
WHERE tier IS NULL OR tier = 'free';

COMMIT;




