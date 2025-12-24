-- 202512240001_compute_relationship_touch_dates.sql
-- Computes next_touch_due_at and updates last_interaction_at for relationships
-- Implements NEX-5: Relationship cadence & "due for touch" status

BEGIN;

-- Function to compute cadence_days from cadence enum
CREATE OR REPLACE FUNCTION get_cadence_days(cadence relationship_cadence)
RETURNS INTEGER AS $$
BEGIN
  CASE cadence
    WHEN 'frequent' THEN RETURN 7;   -- Weekly
    WHEN 'moderate' THEN RETURN 14;   -- Bi-weekly
    WHEN 'infrequent' THEN RETURN 30; -- Monthly
    WHEN 'ad_hoc' THEN RETURN NULL;   -- No fixed cadence
    ELSE RETURN NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update last_interaction_at and next_touch_due_at for a relationship
-- Called when actions are completed
CREATE OR REPLACE FUNCTION update_relationship_touch_dates()
RETURNS TRIGGER AS $$
DECLARE
  lead_id_val UUID;
  last_interaction TIMESTAMPTZ;
  cadence_val relationship_cadence;
  cadence_days_val INTEGER;
  next_touch TIMESTAMPTZ;
BEGIN
  -- Only process when action is completed (DONE, SENT, or REPLIED)
  IF NEW.state IN ('DONE', 'SENT', 'REPLIED') AND NEW.completed_at IS NOT NULL THEN
    lead_id_val := NEW.person_id;
    
    -- Only update if action is tied to a relationship
    IF lead_id_val IS NOT NULL THEN
      -- Get the most recent completed action for this relationship
      SELECT MAX(completed_at)
      INTO last_interaction
      FROM actions
      WHERE person_id = lead_id_val
        AND state IN ('DONE', 'SENT', 'REPLIED')
        AND completed_at IS NOT NULL;
      
      -- Get cadence for this relationship
      SELECT cadence INTO cadence_val
      FROM leads
      WHERE id = lead_id_val;
      
      -- Compute cadence_days
      IF cadence_val IS NOT NULL THEN
        cadence_days_val := get_cadence_days(cadence_val);
      END IF;
      
      -- Update last_interaction_at
      UPDATE leads
      SET last_interaction_at = last_interaction
      WHERE id = lead_id_val;
      
      -- Compute and update next_touch_due_at if cadence is set
      IF last_interaction IS NOT NULL AND cadence_days_val IS NOT NULL THEN
        next_touch := last_interaction + (cadence_days_val::TEXT || ' days')::INTERVAL;
        UPDATE leads
        SET next_touch_due_at = next_touch
        WHERE id = lead_id_val;
      ELSIF cadence_val = 'ad_hoc' OR cadence_val IS NULL THEN
        -- Clear next_touch_due_at for ad_hoc or no cadence
        UPDATE leads
        SET next_touch_due_at = NULL
        WHERE id = lead_id_val;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update relationship touch dates when actions are completed
DROP TRIGGER IF EXISTS trigger_update_relationship_touch_dates ON actions;
CREATE TRIGGER trigger_update_relationship_touch_dates
  AFTER INSERT OR UPDATE OF state, completed_at ON actions
  FOR EACH ROW
  WHEN (NEW.state IN ('DONE', 'SENT', 'REPLIED') AND NEW.completed_at IS NOT NULL)
  EXECUTE FUNCTION update_relationship_touch_dates();

-- Function to update next_touch_due_at when cadence changes
CREATE OR REPLACE FUNCTION update_next_touch_on_cadence_change()
RETURNS TRIGGER AS $$
DECLARE
  cadence_days_val INTEGER;
  next_touch TIMESTAMPTZ;
BEGIN
  -- Only update if cadence changed
  IF NEW.cadence IS DISTINCT FROM OLD.cadence OR NEW.last_interaction_at IS DISTINCT FROM OLD.last_interaction_at THEN
    -- Compute cadence_days
    IF NEW.cadence IS NOT NULL THEN
      cadence_days_val := get_cadence_days(NEW.cadence);
    END IF;
    
    -- Update cadence_days field
    NEW.cadence_days := cadence_days_val;
    
    -- Compute next_touch_due_at
    IF NEW.last_interaction_at IS NOT NULL AND cadence_days_val IS NOT NULL THEN
      next_touch := NEW.last_interaction_at + (cadence_days_val::TEXT || ' days')::INTERVAL;
      NEW.next_touch_due_at := next_touch;
    ELSIF NEW.cadence = 'ad_hoc' OR NEW.cadence IS NULL THEN
      NEW.next_touch_due_at := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update next_touch_due_at when cadence or last_interaction_at changes
DROP TRIGGER IF EXISTS trigger_update_next_touch_on_cadence_change ON leads;
CREATE TRIGGER trigger_update_next_touch_on_cadence_change
  BEFORE UPDATE OF cadence, last_interaction_at ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_next_touch_on_cadence_change();

-- Backfill: Update last_interaction_at and next_touch_due_at for existing relationships
-- This runs once to populate data for existing leads
DO $$
DECLARE
  lead_record RECORD;
  last_interaction TIMESTAMPTZ;
  cadence_days_val INTEGER;
  next_touch TIMESTAMPTZ;
BEGIN
  FOR lead_record IN SELECT id, cadence FROM leads LOOP
    -- Get most recent completed action
    SELECT MAX(completed_at)
    INTO last_interaction
    FROM actions
    WHERE person_id = lead_record.id
      AND state IN ('DONE', 'SENT', 'REPLIED')
      AND completed_at IS NOT NULL;
    
    -- Update last_interaction_at
    UPDATE leads
    SET last_interaction_at = last_interaction
    WHERE id = lead_record.id;
    
    -- Compute next_touch_due_at if cadence is set
    IF lead_record.cadence IS NOT NULL THEN
      cadence_days_val := get_cadence_days(lead_record.cadence);
      
      IF last_interaction IS NOT NULL AND cadence_days_val IS NOT NULL THEN
        next_touch := last_interaction + (cadence_days_val::TEXT || ' days')::INTERVAL;
        UPDATE leads
        SET next_touch_due_at = next_touch,
            cadence_days = cadence_days_val
        WHERE id = lead_record.id;
      ELSIF lead_record.cadence = 'ad_hoc' THEN
        UPDATE leads
        SET next_touch_due_at = NULL,
            cadence_days = NULL
        WHERE id = lead_record.id;
      END IF;
    END IF;
  END LOOP;
END $$;

COMMIT;

