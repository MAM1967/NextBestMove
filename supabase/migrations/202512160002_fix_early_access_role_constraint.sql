-- Fix early_access_signups role constraint to match form options
-- Date: 2025-12-16
-- Issue: Database constraint had old role values that don't match the form
-- Old values: 'fractional_cmo', 'agency', 'consultant', 'other'
-- New values: 'fractional_executive', 'solopreneur', 'independent_consultant', 'agency', 'other'

-- First, update any existing records with old role values to new values
UPDATE early_access_signups
SET role = CASE
  WHEN role = 'fractional_cmo' THEN 'fractional_executive'
  WHEN role = 'consultant' THEN 'independent_consultant'
  ELSE role
END
WHERE role IN ('fractional_cmo', 'consultant');

-- Drop the old constraint
ALTER TABLE early_access_signups
DROP CONSTRAINT IF EXISTS early_access_signups_role_check;

-- Add the new constraint with correct role values
ALTER TABLE early_access_signups
ADD CONSTRAINT early_access_signups_role_check 
CHECK (role IN ('fractional_executive', 'solopreneur', 'independent_consultant', 'agency', 'other'));

