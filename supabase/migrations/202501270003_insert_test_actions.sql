-- Insert test actions for plan generation testing
-- This script automatically uses the first user from auth.users
-- Run this in your Supabase SQL editor or via migration

DO $$
DECLARE
  v_user_id UUID;
  v_today DATE := CURRENT_DATE;
  v_inserted_count INTEGER := 0;
BEGIN
  -- Get user by email
  SELECT id INTO v_user_id 
  FROM users 
  WHERE email = 'mcddsl+test1@gmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found. Please sign up first to create a user account.';
  END IF;

  -- Insert test actions
  -- These actions test various scenarios for plan generation:
  -- - Fast Win candidates (FOLLOW_UP on today)
  -- - SNOOZED actions now due (high priority)
  -- - Regular priority actions (various types and due dates)
  -- - Actions that should NOT appear (future dates, snoozed until future)
  -- 
  -- Note: We set created_at explicitly to satisfy the valid_due_date constraint
  -- (due_date >= DATE(created_at)). For past-due actions, created_at must be before due_date.
  
  INSERT INTO actions (
    user_id,
    person_id,
    action_type,
    state,
    description,
    due_date,
    snooze_until,
    auto_created,
    created_at
  ) VALUES
    -- Fast Win candidates (should be selected first)
    (v_user_id, NULL, 'FOLLOW_UP', 'NEW', 'Follow up on recent reply from Sarah', v_today, NULL, false, NOW() - INTERVAL '1 day'),
    (v_user_id, NULL, 'FOLLOW_UP', 'NEW', 'Quick check-in with Mike', v_today, NULL, false, NOW() - INTERVAL '1 day'),
    
    -- SNOOZED actions now due (should be high priority)
    (v_user_id, NULL, 'FOLLOW_UP', 'SNOOZED', 'Follow up on proposal sent last week', v_today, v_today, false, NOW() - INTERVAL '2 days'),
    (v_user_id, NULL, 'OUTREACH', 'SNOOZED', 'Reach out to new prospect', v_today - INTERVAL '1 day', v_today, false, NOW() - INTERVAL '3 days'),
    
    -- Regular priority actions
    (v_user_id, NULL, 'FOLLOW_UP', 'NEW', 'Follow up on meeting from 2 days ago', v_today - INTERVAL '2 days', NULL, false, NOW() - INTERVAL '3 days'),
    (v_user_id, NULL, 'OUTREACH', 'NEW', 'Connect with potential client', v_today, NULL, false, NOW() - INTERVAL '1 day'),
    (v_user_id, NULL, 'NURTURE', 'NEW', 'Send helpful article to contact', v_today, NULL, false, NOW() - INTERVAL '1 day'),
    (v_user_id, NULL, 'NURTURE', 'NEW', 'Like and comment on recent post', v_today, NULL, false, NOW() - INTERVAL '1 day'),
    (v_user_id, NULL, 'OUTREACH', 'NEW', 'Introduce yourself to new connection', v_today - INTERVAL '1 day', NULL, false, NOW() - INTERVAL '2 days'),
    (v_user_id, NULL, 'CONTENT', 'NEW', 'Draft LinkedIn post about industry trends', v_today, NULL, false, NOW() - INTERVAL '1 day'),
    (v_user_id, NULL, 'CALL_PREP', 'NEW', 'Prepare for client call tomorrow', v_today, NULL, false, NOW() - INTERVAL '1 day'),
    (v_user_id, NULL, 'POST_CALL', 'NEW', 'Send follow-up notes from yesterday''s call', v_today - INTERVAL '1 day', NULL, false, NOW() - INTERVAL '2 days'),
    
    -- Lower priority (due further in past, but still candidates)
    (v_user_id, NULL, 'FOLLOW_UP', 'NEW', 'Follow up on conversation from last week', v_today - INTERVAL '3 days', NULL, false, NOW() - INTERVAL '4 days'),
    (v_user_id, NULL, 'NURTURE', 'NEW', 'Check in with old contact', v_today - INTERVAL '5 days', NULL, false, NOW() - INTERVAL '6 days'),
    
    -- SNOOZED actions not yet due (should NOT be selected - these test the filter)
    (v_user_id, NULL, 'FOLLOW_UP', 'SNOOZED', 'This should not appear - snoozed until tomorrow', v_today + INTERVAL '1 day', v_today + INTERVAL '1 day', false, NOW()),
    
    -- Future actions (should NOT be selected - these test the filter)
    (v_user_id, NULL, 'OUTREACH', 'NEW', 'This should not appear - due tomorrow', v_today + INTERVAL '1 day', NULL, false, NOW());

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

  RAISE NOTICE '✅ Successfully inserted % test actions for user: %', v_inserted_count, v_user_id;
  RAISE NOTICE '📋 Expected in plan: ~6-8 actions (depending on capacity level)';
  RAISE NOTICE '🚀 You can now test plan generation on the /app/plan page';
END $$;

