-- Create test pins and actions for mcddsl+standard@gmail.com
-- This migration creates test data for testing Standard plan features
-- Run this in Supabase SQL Editor or via migration

DO $$
DECLARE
  v_user_id UUID;
  v_today DATE := CURRENT_DATE;
  v_pin_1_id UUID;
  v_pin_2_id UUID;
  v_pin_3_id UUID;
  v_pin_4_id UUID;
  v_pin_5_id UUID;
  v_inserted_pins INTEGER := 0;
  v_inserted_actions INTEGER := 0;
BEGIN
  -- Get user by email
  SELECT id INTO v_user_id 
  FROM users 
  WHERE email = 'mcddsl+standard@gmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User mcddsl+standard@gmail.com not found. Please ensure the user has signed up and verified their email.';
  END IF;

  RAISE NOTICE 'Found user: % (ID: %)', 'mcddsl+standard@gmail.com', v_user_id;

  -- Create test pins (5 pins for testing)
  INSERT INTO person_pins (
    user_id,
    name,
    url,
    notes,
    status
  ) VALUES
    (v_user_id, 'Sarah Johnson', 'https://linkedin.com/in/sarah-johnson', 'VP of Sales at TechCorp. Met at conference last month.', 'ACTIVE'),
    (v_user_id, 'Mike Chen', 'https://linkedin.com/in/mike-chen', 'Product Manager. Interested in our solution.', 'ACTIVE'),
    (v_user_id, 'Emily Rodriguez', 'mailto:emily@example.com', 'Marketing Director. Follow up on proposal.', 'ACTIVE'),
    (v_user_id, 'David Kim', 'https://linkedin.com/in/david-kim', 'CEO of StartupXYZ. Potential partnership opportunity.', 'ACTIVE'),
    (v_user_id, 'Lisa Anderson', 'https://linkedin.com/in/lisa-anderson', 'HR Manager. Discussing team expansion.', 'ACTIVE');

  GET DIAGNOSTICS v_inserted_pins = ROW_COUNT;

  -- Get the pin IDs we just created (using ORDER BY created_at DESC to get the most recent ones)
  SELECT id INTO STRICT v_pin_1_id FROM person_pins WHERE user_id = v_user_id AND name = 'Sarah Johnson' ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO STRICT v_pin_2_id FROM person_pins WHERE user_id = v_user_id AND name = 'Mike Chen' ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO STRICT v_pin_3_id FROM person_pins WHERE user_id = v_user_id AND name = 'Emily Rodriguez' ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO STRICT v_pin_4_id FROM person_pins WHERE user_id = v_user_id AND name = 'David Kim' ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO STRICT v_pin_5_id FROM person_pins WHERE user_id = v_user_id AND name = 'Lisa Anderson' ORDER BY created_at DESC LIMIT 1;

  RAISE NOTICE 'Created % pins', v_inserted_pins;

  -- Create test actions linked to pins
  -- Mix of action types, states, and due dates for comprehensive testing
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
    -- Fast Win candidates (due today, NEW state)
    (v_user_id, v_pin_1_id, 'FOLLOW_UP', 'NEW', 'Follow up on recent reply from Sarah about pricing', v_today, NULL, false, NOW() - INTERVAL '1 day'),
    (v_user_id, v_pin_2_id, 'OUTREACH', 'NEW', 'Send introduction email to Mike', v_today, NULL, false, NOW() - INTERVAL '1 day'),
    
    -- SNOOZED actions now due (high priority)
    (v_user_id, v_pin_3_id, 'FOLLOW_UP', 'SNOOZED', 'Follow up on proposal sent to Emily last week', v_today, v_today, false, NOW() - INTERVAL '2 days'),
    (v_user_id, v_pin_1_id, 'NURTURE', 'SNOOZED', 'Share industry article with Sarah', v_today - INTERVAL '1 day', v_today, false, NOW() - INTERVAL '3 days'),
    
    -- Regular priority actions (various types)
    (v_user_id, v_pin_4_id, 'OUTREACH', 'NEW', 'Reach out to David about partnership opportunity', v_today - INTERVAL '2 days', NULL, false, NOW() - INTERVAL '3 days'),
    (v_user_id, v_pin_5_id, 'FOLLOW_UP', 'NEW', 'Follow up on meeting with Lisa from 3 days ago', v_today - INTERVAL '3 days', NULL, false, NOW() - INTERVAL '4 days'),
    (v_user_id, v_pin_2_id, 'NURTURE', 'NEW', 'Like and comment on Mike''s recent LinkedIn post', v_today, NULL, false, NOW() - INTERVAL '1 day'),
    (v_user_id, v_pin_3_id, 'CALL_PREP', 'NEW', 'Prepare for call with Emily tomorrow', v_today, NULL, false, NOW() - INTERVAL '1 day'),
    (v_user_id, v_pin_4_id, 'CONTENT', 'NEW', 'Draft LinkedIn post about partnership with David''s company', v_today, NULL, false, NOW() - INTERVAL '1 day'),
    (v_user_id, v_pin_1_id, 'POST_CALL', 'NEW', 'Send follow-up notes from yesterday''s call with Sarah', v_today - INTERVAL '1 day', NULL, false, NOW() - INTERVAL '2 days'),
    
    -- Lower priority (older due dates)
    (v_user_id, v_pin_5_id, 'NURTURE', 'NEW', 'Check in with Lisa about team expansion plans', v_today - INTERVAL '5 days', NULL, false, NOW() - INTERVAL '6 days'),
    (v_user_id, v_pin_2_id, 'FOLLOW_UP', 'NEW', 'Follow up on conversation with Mike from last week', v_today - INTERVAL '7 days', NULL, false, NOW() - INTERVAL '8 days'),
    
    -- SNOOZED actions not yet due (should NOT appear in plan)
    (v_user_id, v_pin_3_id, 'FOLLOW_UP', 'SNOOZED', 'This should not appear - snoozed until tomorrow', v_today + INTERVAL '1 day', v_today + INTERVAL '1 day', false, NOW()),
    
    -- Future actions (should NOT appear in plan)
    (v_user_id, v_pin_4_id, 'OUTREACH', 'NEW', 'This should not appear - due tomorrow', v_today + INTERVAL '1 day', NULL, false, NOW());

  GET DIAGNOSTICS v_inserted_actions = ROW_COUNT;

  RAISE NOTICE '✅ Successfully created test data for user: %', 'mcddsl+standard@gmail.com';
  RAISE NOTICE '📌 Created % pins', v_inserted_pins;
  RAISE NOTICE '📋 Created % actions', v_inserted_actions;
  RAISE NOTICE '🚀 Test data ready for Standard plan testing';
END $$;

-- Verify the test data was created
SELECT 
  'Pins' as data_type,
  COUNT(*) as count
FROM person_pins
WHERE user_id = (SELECT id FROM users WHERE email = 'mcddsl+standard@gmail.com')
  AND status = 'ACTIVE'

UNION ALL

SELECT 
  'Actions' as data_type,
  COUNT(*) as count
FROM actions
WHERE user_id = (SELECT id FROM users WHERE email = 'mcddsl+standard@gmail.com')
  AND state IN ('NEW', 'SNOOZED');

-- Show pins created
SELECT 
  name,
  url,
  status,
  created_at
FROM person_pins
WHERE user_id = (SELECT id FROM users WHERE email = 'mcddsl+standard@gmail.com')
ORDER BY created_at DESC;

-- Show actions created (summary)
SELECT 
  action_type,
  state,
  COUNT(*) as count,
  MIN(due_date) as earliest_due,
  MAX(due_date) as latest_due
FROM actions
WHERE user_id = (SELECT id FROM users WHERE email = 'mcddsl+standard@gmail.com')
GROUP BY action_type, state
ORDER BY action_type, state;

