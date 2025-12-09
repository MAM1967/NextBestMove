-- Create Test Actions
-- Use this to create test actions for a specific user/lead
-- Replace '<user_email>' with your test user email

-- Step 1: Get user ID and lead ID
SELECT 
  u.id as user_id,
  u.email,
  l.id as lead_id,
  l.name as lead_name
FROM users u
LEFT JOIN leads l ON l.user_id = u.id AND l.status = 'ACTIVE'
WHERE u.email = '<user_email>'
LIMIT 5;

-- Step 2: Create test actions (replace USER_ID and LEAD_ID from Step 1)
INSERT INTO actions (
  user_id,
  person_id,
  action_type,
  state,
  description,
  due_date,
  notes,
  auto_created
) VALUES
  (
    '<USER_ID>'::uuid,
    '<LEAD_ID>'::uuid,  -- Can be NULL for non-lead actions
    'OUTREACH'::action_type,
    'NEW'::action_state,
    'Reach out to discuss partnership opportunity',
    CURRENT_DATE,
    'Initial outreach',
    false
  ),
  (
    '<USER_ID>'::uuid,
    '<LEAD_ID>'::uuid,
    'FOLLOW_UP'::action_type,
    'NEW'::action_state,
    'Follow up on previous conversation',
    CURRENT_DATE + INTERVAL '2 days',
    'Waiting for response',
    false
  ),
  (
    '<USER_ID>'::uuid,
    NULL,  -- Fast win actions don't need a lead
    'FAST_WIN'::action_type,
    'NEW'::action_state,
    'Quick win action - review email template',
    CURRENT_DATE,
    NULL,
    false
  );

-- Step 3: Verify actions were created
SELECT 
  a.id,
  a.action_type,
  a.state,
  a.description,
  a.due_date,
  l.name as lead_name,
  a.auto_created
FROM actions a
LEFT JOIN leads l ON l.id = a.person_id
WHERE a.user_id = '<USER_ID>'::uuid
ORDER BY a.created_at DESC
LIMIT 10;

