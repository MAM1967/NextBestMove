-- 202512250002_add_preferred_channel_to_leads.sql
-- Adds preferred_channel field to leads table for NEX-15: Relationship channel awareness

BEGIN;

-- Create enum type for preferred communication channel
CREATE TYPE preferred_channel AS ENUM ('linkedin', 'email', 'text', 'other');

-- Add preferred_channel column to leads table
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS preferred_channel preferred_channel;

-- Add index for preferred_channel queries
CREATE INDEX IF NOT EXISTS idx_leads_preferred_channel ON leads(preferred_channel) WHERE preferred_channel IS NOT NULL;

COMMIT;





