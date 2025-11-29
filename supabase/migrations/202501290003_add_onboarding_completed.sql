-- Add onboarding_completed flag to users table
-- This tracks whether a user has completed the onboarding flow

ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Create index for quick lookups of users who haven't completed onboarding
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON users(onboarding_completed) WHERE onboarding_completed = false;

