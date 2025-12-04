-- Create test performance timeline data for mcddsl@icloud.com
-- This script generates historical data for the last 30 days based on actual user activity
-- Run this if the cron job hasn't run yet or you want to backfill data

DO $$
DECLARE
  v_user_id UUID;
  v_date DATE;
  v_metrics JSONB;
  v_actions_completed INTEGER;
  v_actions_created INTEGER;
  v_replies_received INTEGER;
  v_pins_created INTEGER;
  v_pins_archived INTEGER;
  v_streak_day INTEGER;
  v_completion_rate NUMERIC;
  v_reply_rate NUMERIC;
  v_outreach_actions INTEGER;
  v_start_of_day TIMESTAMPTZ;
  v_end_of_day TIMESTAMPTZ;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id
  FROM users
  WHERE email = 'mcddsl@icloud.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User mcddsl@icloud.com not found';
  END IF;

  RAISE NOTICE 'Found user: % (ID: %)', 'mcddsl@icloud.com', v_user_id;

  -- Generate data for the last 30 days
  FOR i IN 0..29 LOOP
    v_date := CURRENT_DATE - i;
    v_start_of_day := (v_date::text || ' 00:00:00+00')::timestamptz;
    v_end_of_day := (v_date::text || ' 23:59:59+00')::timestamptz;

    -- Calculate metrics for this day
    -- Actions completed
    SELECT COUNT(*) INTO v_actions_completed
    FROM actions
    WHERE user_id = v_user_id
      AND state IN ('DONE', 'REPLIED', 'SENT')
      AND completed_at >= v_start_of_day
      AND completed_at <= v_end_of_day;

    -- Actions created
    SELECT COUNT(*) INTO v_actions_created
    FROM actions
    WHERE user_id = v_user_id
      AND created_at >= v_start_of_day
      AND created_at <= v_end_of_day;

    -- Replies received (actions with state = 'REPLIED')
    SELECT COUNT(*) INTO v_replies_received
    FROM actions
    WHERE user_id = v_user_id
      AND state = 'REPLIED'
      AND completed_at >= v_start_of_day
      AND completed_at <= v_end_of_day;

    -- Pins created
    SELECT COUNT(*) INTO v_pins_created
    FROM person_pins
    WHERE user_id = v_user_id
      AND created_at >= v_start_of_day
      AND created_at <= v_end_of_day;

    -- Pins archived
    SELECT COUNT(*) INTO v_pins_archived
    FROM person_pins
    WHERE user_id = v_user_id
      AND status = 'ARCHIVED'
      AND updated_at >= v_start_of_day
      AND updated_at <= v_end_of_day;

    -- Get current streak (from users table, but for historical data we'll use a simple calculation)
    SELECT COALESCE(streak_count, 0) INTO v_streak_day
    FROM users
    WHERE id = v_user_id;

    -- Calculate completion rate (capped at 100%)
    -- Note: actions_completed includes all actions completed on this day (may be from previous days)
    -- actions_created only includes actions created on this day
    -- We cap at 100% to avoid >100% rates when completing old actions
    IF v_actions_created > 0 THEN
      v_completion_rate := LEAST(1.0, ROUND((v_actions_completed::NUMERIC / v_actions_created::NUMERIC)::NUMERIC, 2));
    ELSE
      v_completion_rate := 0;
    END IF;

    -- Calculate reply rate (replies / outreach actions, capped at 100%)
    -- Note: replies_received includes all replies received on this day (may be from previous days' outreach)
    -- outreach_actions only includes outreach actions created on this day
    -- We cap at 100% to avoid >100% rates when receiving replies to old outreach
    SELECT COUNT(*) INTO v_outreach_actions
    FROM actions
    WHERE user_id = v_user_id
      AND action_type = 'OUTREACH'
      AND created_at >= v_start_of_day
      AND created_at <= v_end_of_day;

    IF v_outreach_actions > 0 THEN
      v_reply_rate := LEAST(1.0, ROUND((v_replies_received::NUMERIC / v_outreach_actions::NUMERIC)::NUMERIC, 2));
    ELSE
      v_reply_rate := 0;
    END IF;

    -- Build metrics JSONB
    v_metrics := jsonb_build_object(
      'actions_completed', v_actions_completed,
      'actions_created', v_actions_created,
      'replies_received', v_replies_received,
      'pins_created', v_pins_created,
      'pins_archived', v_pins_archived,
      'streak_day', v_streak_day,
      'completion_rate', v_completion_rate,
      'reply_rate', v_reply_rate
    );

    -- Upsert into performance_timeline_data
    INSERT INTO performance_timeline_data (user_id, date, metrics, created_at, updated_at)
    VALUES (v_user_id, v_date, v_metrics, NOW(), NOW())
    ON CONFLICT (user_id, date) 
    DO UPDATE SET 
      metrics = EXCLUDED.metrics,
      updated_at = NOW();

    RAISE NOTICE 'Created/updated timeline data for date: %, actions_completed: %, actions_created: %', 
      v_date, v_actions_completed, v_actions_created;
  END LOOP;

  RAISE NOTICE '✅ Successfully created/updated performance timeline data for the last 30 days';
END $$;

-- Verify the data was created
SELECT 
  date,
  metrics->>'actions_completed' as actions_completed,
  metrics->>'actions_created' as actions_created,
  metrics->>'replies_received' as replies_received,
  metrics->>'completion_rate' as completion_rate,
  created_at
FROM performance_timeline_data
WHERE user_id = (SELECT id FROM users WHERE email = 'mcddsl@icloud.com')
ORDER BY date DESC
LIMIT 10;

