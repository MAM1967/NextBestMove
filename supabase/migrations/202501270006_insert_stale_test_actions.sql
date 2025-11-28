-- Insert test stale actions (NEW state, not snoozed, created >7 days ago)
-- These will appear in the Insights page as stale actions

DO $$
DECLARE
  test_user_id UUID;
  test_pin_id UUID;
  eight_days_ago TIMESTAMPTZ;
  ten_days_ago TIMESTAMPTZ;
BEGIN
  -- Get a test user (use the first user in the system)
  -- Try users table first, then auth.users as fallback
  SELECT id INTO test_user_id FROM users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  END IF;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'No users found. Please create a user first.';
    RETURN;
  END IF;

  -- Calculate dates (8 and 10 days ago) as timestamps at start of day in UTC
  -- Using explicit dates to ensure they're definitely >7 days old
  -- Today is 11/27/2025, so we need dates from 11/19 or earlier
  -- Explicitly set timezone to UTC for consistent comparison
  eight_days_ago := ('2025-11-19 00:00:00'::TIMESTAMP AT TIME ZONE 'UTC')::TIMESTAMPTZ; -- 8 days ago
  ten_days_ago := ('2025-11-17 00:00:00'::TIMESTAMP AT TIME ZONE 'UTC')::TIMESTAMPTZ; -- 10 days ago

  -- Get or create a test pin for context
  SELECT id INTO test_pin_id 
  FROM person_pins 
  WHERE user_id = test_user_id 
  LIMIT 1;

  -- If no pin exists, create one
  IF test_pin_id IS NULL THEN
    INSERT INTO person_pins (user_id, name, url, status)
    VALUES (
      test_user_id,
      'Test Contact',
      'https://linkedin.com/in/test',
      'ACTIVE'
    )
    RETURNING id INTO test_pin_id;
  END IF;

  -- Insert stale action 1: Created 10 days ago, NEW state, not snoozed
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
    CURRENT_DATE + INTERVAL '2 days', -- Due in future
    ten_days_ago, -- Created 10 days ago
    false
  )
  ON CONFLICT DO NOTHING;

  -- Insert stale action 2: Created 8 days ago, NEW state, not snoozed
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
    CURRENT_DATE - INTERVAL '1 day', -- Overdue
    eight_days_ago, -- Created 8 days ago
    false
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Inserted 2 stale test actions (created 8 and 10 days ago)';
  RAISE NOTICE '📊 These actions should appear in /app/insights as stale actions';
  RAISE NOTICE '🗑️  You can delete these test actions from the Actions page when done testing';
END $$;

