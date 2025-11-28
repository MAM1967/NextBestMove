-- Debug query to check for stale actions
-- Run this to see what actions exist and why they might not be showing up

DO $$
DECLARE
  test_user_id UUID;
  seven_days_ago TIMESTAMPTZ;
  all_new_actions_count INTEGER;
  stale_actions_count INTEGER;
BEGIN
  -- Get a test user
  SELECT id INTO test_user_id FROM users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'No users found.';
    RETURN;
  END IF;

  -- Calculate 7 days ago at start of day
  seven_days_ago := (CURRENT_DATE - INTERVAL '7 days')::TIMESTAMPTZ;

  RAISE NOTICE '=== Stale Actions Debug ===';
  RAISE NOTICE 'User ID: %', test_user_id;
  RAISE NOTICE '7 days ago (cutoff): %', seven_days_ago;
  RAISE NOTICE '';

  -- Count all NEW actions for this user
  SELECT COUNT(*) INTO all_new_actions_count
  FROM actions
  WHERE user_id = test_user_id
    AND state = 'NEW';

  RAISE NOTICE 'Total NEW actions: %', all_new_actions_count;

  -- Count stale actions
  SELECT COUNT(*) INTO stale_actions_count
  FROM actions
  WHERE user_id = test_user_id
    AND state = 'NEW'
    AND snooze_until IS NULL
    AND created_at < seven_days_ago;

  RAISE NOTICE 'Stale actions (NEW, not snoozed, >7 days old): %', stale_actions_count;
  RAISE NOTICE '';

  -- Show all NEW actions with their created_at dates
  RAISE NOTICE 'All NEW actions:';
  FOR rec IN 
    SELECT 
      id,
      action_type,
      description,
      state,
      created_at,
      snooze_until,
      EXTRACT(DAY FROM (CURRENT_TIMESTAMP - created_at))::INTEGER as days_old
    FROM actions
    WHERE user_id = test_user_id
      AND state = 'NEW'
    ORDER BY created_at ASC
  LOOP
    RAISE NOTICE '  - %: % (created: %, days old: %, snoozed: %)', 
      rec.action_type, 
      rec.description,
      rec.created_at,
      rec.days_old,
      rec.snooze_until;
  END LOOP;

END $$;


