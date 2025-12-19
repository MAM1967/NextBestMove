-- Migration: Add trigger to automatically update user streak when actions are completed
-- This ensures streak_count is recalculated whenever an action is marked as DONE or REPLIED

-- Create trigger function that updates streak when action state changes to/from DONE or REPLIED
-- or when completed_at is set
CREATE OR REPLACE FUNCTION update_streak_on_action_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Update streak if:
  -- 1. State changed to DONE or REPLIED (INSERT or UPDATE), OR
  -- 2. State changed FROM DONE or REPLIED to something else (need to recalculate), OR
  -- 3. completed_at was just set/changed (and state is DONE or REPLIED)
  IF (
    -- New action with DONE/REPLIED state
    (TG_OP = 'INSERT' AND NEW.state IN ('DONE', 'REPLIED')) OR
    -- State changed to DONE/REPLIED
    (TG_OP = 'UPDATE' AND NEW.state IN ('DONE', 'REPLIED') AND (OLD.state IS NULL OR OLD.state NOT IN ('DONE', 'REPLIED'))) OR
    -- State changed FROM DONE/REPLIED (need to recalculate)
    (TG_OP = 'UPDATE' AND OLD.state IN ('DONE', 'REPLIED') AND NEW.state NOT IN ('DONE', 'REPLIED')) OR
    -- completed_at changed and state is DONE/REPLIED
    (TG_OP = 'UPDATE' AND NEW.state IN ('DONE', 'REPLIED') AND (OLD.completed_at IS DISTINCT FROM NEW.completed_at))
  ) THEN
    -- Update the user's streak count
    PERFORM update_user_streak(NEW.user_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on actions table
DROP TRIGGER IF EXISTS trigger_update_streak_on_action_completion ON actions;

CREATE TRIGGER trigger_update_streak_on_action_completion
  AFTER INSERT OR UPDATE OF state, completed_at ON actions
  FOR EACH ROW
  EXECUTE FUNCTION update_streak_on_action_completion();

-- Also update streak when action is deleted (in case we need to recalculate)
CREATE OR REPLACE FUNCTION update_streak_on_action_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- If a completed action is deleted, recalculate streak
  IF OLD.state IN ('DONE', 'REPLIED') THEN
    PERFORM update_user_streak(OLD.user_id);
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_streak_on_action_deletion ON actions;

CREATE TRIGGER trigger_update_streak_on_action_deletion
  AFTER DELETE ON actions
  FOR EACH ROW
  WHEN (OLD.state IN ('DONE', 'REPLIED'))
  EXECUTE FUNCTION update_streak_on_action_deletion();

-- Backfill: Update streak for all existing users who have completed actions
-- This ensures existing users get their streak calculated
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT DISTINCT user_id FROM actions WHERE state IN ('DONE', 'REPLIED')
  LOOP
    PERFORM update_user_streak(user_record.user_id);
  END LOOP;
END $$;

