-- Direct insert of stale test actions
-- This will insert 2 actions created on 11/17 and 11/19, 2025
-- Run this in Supabase SQL Editor

-- Insert stale actions for the current logged-in user
-- Replace with your actual user ID (the one you're logged in as)
DO $$
DECLARE
  test_user_id UUID := '047fa9df-1464-4f69-a906-0166a0d76091'; -- Your current logged-in user ID
  test_pin_id UUID;
  eight_days_ago TIMESTAMPTZ := '2025-11-19 00:00:00+00'::TIMESTAMPTZ;
  ten_days_ago TIMESTAMPTZ := '2025-11-17 00:00:00+00'::TIMESTAMPTZ;
BEGIN
  -- Get or create a test pin
  SELECT id INTO test_pin_id 
  FROM person_pins 
  WHERE user_id = test_user_id 
  LIMIT 1;

  IF test_pin_id IS NULL THEN
    INSERT INTO person_pins (user_id, name, url, status)
    VALUES (
      test_user_id,
      'Test Contact for Stale Actions',
      'https://linkedin.com/in/test-stale',
      'ACTIVE'
    )
    RETURNING id INTO test_pin_id;
  END IF;

  -- Delete any existing stale test actions first (to avoid duplicates)
  DELETE FROM actions 
  WHERE user_id = test_user_id 
    AND description IN (
      'Reach out to potential client - stale test action',
      'Follow up on old connection - stale test action'
    );

  -- Insert stale action 1: Created 10 days ago (11/17)
  INSERT INTO actions (
    user_id,
    person_id,
    action_type,
    state,
    description,
    due_date,
    created_at,
    auto_created
  )
  VALUES (
    test_user_id,
    test_pin_id,
    'OUTREACH',
    'NEW',
    'Reach out to potential client - stale test action',
    '2025-11-17'::DATE, -- Due date same as created_at (valid_due_date constraint)
    ten_days_ago,
    false
  );

  -- Insert stale action 2: Created 8 days ago (11/19)
  INSERT INTO actions (
    user_id,
    person_id,
    action_type,
    state,
    description,
    due_date,
    created_at,
    auto_created
  )
  VALUES (
    test_user_id,
    test_pin_id,
    'NURTURE',
    'NEW',
    'Follow up on old connection - stale test action',
    '2025-11-19'::DATE, -- Due date same as created_at (valid_due_date constraint)
    eight_days_ago,
    false
  );

  RAISE NOTICE '✅ Inserted 2 stale test actions';
  RAISE NOTICE '   - Action 1: Created 2025-11-17 (10 days ago)';
  RAISE NOTICE '   - Action 2: Created 2025-11-19 (8 days ago)';
END $$;

-- Verify they were inserted
SELECT 
  id,
  action_type,
  state,
  description,
  created_at,
  EXTRACT(DAY FROM (CURRENT_TIMESTAMP - created_at))::INTEGER as days_old
FROM actions
WHERE description IN (
  'Reach out to potential client - stale test action',
  'Follow up on old connection - stale test action'
)
ORDER BY created_at;

