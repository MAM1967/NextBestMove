-- Add onboarding_completed flag to users table
-- This tracks whether a user has completed the onboarding flow

ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Mark all existing users as having completed onboarding
-- (so they don't have to go through it again)
-- New users will default to false and will be prompted to complete onboarding
UPDATE users
SET onboarding_completed = true
WHERE onboarding_completed = false;

-- Create index for quick lookups of users who haven't completed onboarding
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON users(onboarding_completed) WHERE onboarding_completed = false;

