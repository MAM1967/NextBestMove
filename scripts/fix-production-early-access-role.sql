-- Production Database Fix: Early Access Form Role Constraint
-- Date: 2025-12-16
-- Description: Fix role constraint to match form options
-- 
-- The database constraint had old role values that don't match the form:
-- Old: 'fractional_cmo', 'agency', 'consultant', 'other'
-- New: 'fractional_executive', 'solopreneur', 'independent_consultant', 'agency', 'other'
--
-- Run this script against the production Supabase database
-- via Supabase Dashboard SQL Editor or CLI

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

-- Verify the constraint
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'early_access_signups'::regclass
  AND conname = 'early_access_signups_role_check';

