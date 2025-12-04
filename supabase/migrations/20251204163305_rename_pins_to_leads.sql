-- 20251204163305_rename_pins_to_leads.sql
-- Phase 1: Database Schema Refactoring
-- Renames person_pins → leads and pin_status → lead_status
-- This is a breaking change that requires coordinated frontend/backend deployment

BEGIN;

-- Step 1: Rename enum type
ALTER TYPE pin_status RENAME TO lead_status;

-- Step 2: Rename table
ALTER TABLE person_pins RENAME TO leads;

-- Step 3: Rename indexes
ALTER INDEX IF EXISTS idx_person_pins_user_id RENAME TO idx_leads_user_id;
ALTER INDEX IF EXISTS idx_person_pins_status RENAME TO idx_leads_status;
ALTER INDEX IF EXISTS idx_person_pins_user_status RENAME TO idx_leads_user_status;
ALTER INDEX IF EXISTS idx_person_pins_snooze_until RENAME TO idx_leads_snooze_until;

-- Step 4: Rename trigger
DROP TRIGGER IF EXISTS update_person_pins_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Update foreign key in actions table
-- First, drop the old constraint (name may vary, so we'll try to find it)
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Find the constraint name
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'actions'::regclass
    AND confrelid = 'leads'::regclass
    AND contype = 'f';
  
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE actions DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END IF;
END $$;

-- Add new foreign key constraint
ALTER TABLE actions
  ADD CONSTRAINT actions_person_id_fkey 
    FOREIGN KEY (person_id) REFERENCES leads(id) ON DELETE SET NULL;

-- Step 6: Update foreign key in pre_call_briefs table
-- First, drop the old constraint
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Find the constraint name
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'pre_call_briefs'::regclass
    AND confrelid = 'leads'::regclass
    AND contype = 'f';
  
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE pre_call_briefs DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END IF;
END $$;

-- Add new foreign key constraint (keeping person_pin_id column name for now to avoid breaking changes)
ALTER TABLE pre_call_briefs
  ADD CONSTRAINT pre_call_briefs_person_pin_id_fkey 
    FOREIGN KEY (person_pin_id) REFERENCES leads(id) ON DELETE SET NULL;

-- Rename the index for pre_call_briefs
ALTER INDEX IF EXISTS idx_pre_call_briefs_person_pin_id RENAME TO idx_pre_call_briefs_lead_id;

-- Step 7: Update RLS policies
DROP POLICY IF EXISTS "Users can view own pins" ON leads;
DROP POLICY IF EXISTS "Users can manage own pins" ON leads;

CREATE POLICY "Users can view own leads" ON leads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own leads" ON leads
  FOR ALL USING (auth.uid() = user_id);

-- Step 8: Update auto_unsnooze_items() function to reference leads table
CREATE OR REPLACE FUNCTION auto_unsnooze_items()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE leads
  SET status = 'ACTIVE', snooze_until = NULL
  WHERE status = 'SNOOZED'
    AND snooze_until IS NOT NULL
    AND snooze_until <= CURRENT_DATE;

  UPDATE actions
  SET state = 'NEW', snooze_until = NULL
  WHERE state = 'SNOOZED'
    AND snooze_until IS NOT NULL
    AND snooze_until <= CURRENT_DATE;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Update pattern detection function that references person_pins
-- Update detect_warm_reengagement_pattern function
CREATE OR REPLACE FUNCTION detect_warm_reengagement_pattern(p_user_id UUID)
RETURNS TABLE (
  reengaged_count INTEGER,
  success_rate NUMERIC(5, 2)
) AS $$
DECLARE
  v_reengaged_count INTEGER;
  v_success_count INTEGER;
BEGIN
  -- Count actions on leads that were archived or snoozed before the action
  SELECT 
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE a.state = 'REPLIED')::INTEGER
  INTO v_reengaged_count, v_success_count
  FROM actions a
  JOIN leads l ON l.id = a.person_id
  WHERE a.user_id = p_user_id
    AND a.created_at >= CURRENT_DATE - INTERVAL '90 days'
    AND (
      -- Lead is currently archived/snoozed (was likely archived before action)
      l.status IN ('ARCHIVED', 'SNOOZED')
      OR EXISTS (
        -- Check if lead was archived/snoozed before this action
        SELECT 1 
        FROM leads l2
        WHERE l2.id = l.id
          AND l2.status IN ('ARCHIVED', 'SNOOZED')
          AND l2.updated_at < a.created_at
      )
    );

  -- Only return if we have enough data
  IF v_reengaged_count >= 3 THEN
    RETURN QUERY
    SELECT 
      v_reengaged_count AS reengaged_count,
      CASE 
        WHEN v_reengaged_count > 0 
        THEN (v_success_count::NUMERIC / v_reengaged_count::NUMERIC) * 100
        ELSE 0
      END AS success_rate;
  ELSE
    -- Return zero values if not enough data
    RETURN QUERY
    SELECT 0::INTEGER, 0::NUMERIC(5, 2);
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Verification queries (run these after migration to verify)
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leads';
-- SELECT typname FROM pg_type WHERE typname = 'lead_status';
-- SELECT indexname FROM pg_indexes WHERE tablename = 'leads';
-- SELECT conname FROM pg_constraint WHERE conrelid = 'actions'::regclass AND confrelid = 'leads'::regclass;

