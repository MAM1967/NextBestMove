-- Create Test Leads
-- Use this to create test leads for a specific user
-- Replace '<user_email>' with your test user email

-- Step 1: Get user ID
SELECT id as user_id, email 
FROM users 
WHERE email = '<user_email>';

-- Step 2: Create test leads (replace USER_ID with the ID from Step 1)
INSERT INTO leads (
  user_id,
  name,
  url,
  notes,
  status
) VALUES
  (
    '<USER_ID>'::uuid,
    'John Doe',
    'https://linkedin.com/in/johndoe',
    'Met at conference - interested in partnership',
    'ACTIVE'
  ),
  (
    '<USER_ID>'::uuid,
    'Jane Smith',
    'https://linkedin.com/in/janesmith',
    'Follow up next week about product demo',
    'ACTIVE'
  ),
  (
    '<USER_ID>'::uuid,
    'Bob Johnson',
    'mailto:bob@example.com',
    'Waiting for proposal response',
    'SNOOZED'
  );

-- Step 3: Verify leads were created
SELECT 
  id,
  name,
  url,
  status,
  created_at
FROM leads
WHERE user_id = '<USER_ID>'::uuid
ORDER BY created_at DESC;

