-- Create an action for Peter (for testing pre-call briefs)
-- This will create a FOLLOW_UP action that can be used to test the pre-call brief feature

-- Step 1: Find Peter's pin ID
SELECT 
  id as peter_pin_id,
  name,
  status
FROM person_pins
WHERE name ILIKE '%Peter%'
  AND status = 'ACTIVE'
LIMIT 1;

-- Step 2: Create an action for Peter (replace 'PETER_PIN_ID' with the ID from Step 1)
-- You can also replace the action_type with: OUTREACH, FOLLOW_UP, NURTURE, CALL_PREP, POST_CALL, CONTENT, FAST_WIN
-- Replace 'YOUR_USER_ID' with your actual user ID (or use the query below to find it)

-- First, get your user ID:
SELECT id as user_id, email 
FROM users 
WHERE email = 'mcddsl@icloud.com';

-- Then create the action (replace USER_ID and PETER_PIN_ID):
INSERT INTO actions (
  user_id,
  person_id,
  action_type,
  state,
  description,
  due_date,
  auto_created
)
SELECT 
  u.id as user_id,
  pp.id as person_id,
  'FOLLOW_UP'::action_type,
  'NEW'::action_state,
  'Follow up with Peter',
  CURRENT_DATE as due_date,
  false as auto_created
FROM users u
CROSS JOIN person_pins pp
WHERE u.email = 'mcddsl@icloud.com'
  AND pp.name ILIKE '%Peter%'
  AND pp.status = 'ACTIVE'
LIMIT 1;

-- Step 3: Verify the action was created
SELECT 
  a.id,
  a.action_type,
  a.state,
  a.description,
  a.due_date,
  pp.name as person_name
FROM actions a
JOIN person_pins pp ON pp.id = a.person_id
JOIN users u ON u.id = a.user_id
WHERE u.email = 'mcddsl@icloud.com'
  AND pp.name ILIKE '%Peter%'
ORDER BY a.created_at DESC
LIMIT 5;

