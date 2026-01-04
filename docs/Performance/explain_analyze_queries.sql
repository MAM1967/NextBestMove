-- EXPLAIN ANALYZE Scripts for Critical Queries
-- 
-- Usage:
-- 1. Replace USER_ID_HERE with an actual user ID from your database
-- 2. Replace DATE_HERE with a date in YYYY-MM-DD format
-- 3. Run each query and document the results in Critical_Queries_Analysis.md
--
-- Note: These queries are read-only and safe to run on production (EXPLAIN ANALYZE doesn't modify data)

-- ============================================================================
-- Query 1.1: Fetch Candidate Actions for Daily Plan Generation
-- ============================================================================
EXPLAIN ANALYZE
SELECT 
  a.*,
  l.id as lead_id,
  l.name as lead_name,
  l.linkedin_url,
  l.email,
  l.phone_number,
  l.url,
  l.notes as lead_notes,
  l.created_at as lead_created_at
FROM actions a
LEFT JOIN leads l ON a.person_id = l.id
WHERE a.user_id = 'USER_ID_HERE'
  AND a.state IN ('NEW', 'SNOOZED')
  AND a.due_date <= 'DATE_HERE'
ORDER BY a.due_date ASC, a.created_at DESC;

-- Expected indexes:
-- - idx_actions_user_state_due_date: (user_id, state, due_date)
-- - idx_actions_person_id: (person_id) - foreign key index

-- ============================================================================
-- Query 1.2: Check Existing Daily Plan
-- ============================================================================
EXPLAIN ANALYZE
SELECT id, capacity_override, override_reason
FROM daily_plans
WHERE user_id = 'USER_ID_HERE' 
  AND date = 'DATE_HERE';

-- Expected indexes:
-- - Unique index: (user_id, date)

-- ============================================================================
-- Query 1.3: Get User Profile
-- ============================================================================
EXPLAIN ANALYZE
SELECT exclude_weekends, timezone
FROM users
WHERE id = 'USER_ID_HERE';

-- Expected indexes:
-- - Primary key on id (should be fast)

-- ============================================================================
-- Query 2.1: Fetch Best Action with Relationship Data
-- ============================================================================
EXPLAIN ANALYZE
SELECT 
  a.*,
  l.id as lead_id,
  l.name as lead_name,
  l.url,
  l.notes,
  l.tier,
  l.last_interaction_at,
  l.relationship_state
FROM actions a
LEFT JOIN leads l ON a.person_id = l.id
WHERE a.id = 'ACTION_ID_HERE';

-- Expected indexes:
-- - Primary key on actions.id (should be fast)
-- - Foreign key index on person_id

-- ============================================================================
-- Query 2.2: Count Overdue Actions for Relationship
-- ============================================================================
EXPLAIN ANALYZE
SELECT COUNT(*)
FROM actions
WHERE user_id = 'USER_ID_HERE'
  AND person_id = 'PERSON_ID_HERE'
  AND state = 'NEW'
  AND due_date < CURRENT_DATE;

-- Expected indexes:
-- - Composite index: (user_id, person_id, state, due_date)

-- ============================================================================
-- Query 2.3: Fetch Recent Email Sentiment
-- ============================================================================
EXPLAIN ANALYZE
SELECT sentiment
FROM email_metadata
WHERE user_id = 'USER_ID_HERE'
  AND person_id = 'PERSON_ID_HERE'
  AND received_at >= NOW() - INTERVAL '7 days'
ORDER BY received_at DESC
LIMIT 5;

-- Expected indexes:
-- - Composite index: (user_id, person_id, received_at)

-- ============================================================================
-- Query 2.4: Check for Open Loops
-- ============================================================================
EXPLAIN ANALYZE
SELECT open_loops
FROM email_metadata
WHERE user_id = 'USER_ID_HERE'
  AND person_id = 'PERSON_ID_HERE'
  AND open_loops IS NOT NULL
  AND received_at >= NOW() - INTERVAL '30 days'
LIMIT 1;

-- Expected indexes:
-- - Composite index: (user_id, person_id, received_at)

-- ============================================================================
-- Query 2.5: Count Total Actions for Response Rate
-- ============================================================================
EXPLAIN ANALYZE
SELECT COUNT(*)
FROM actions
WHERE user_id = 'USER_ID_HERE'
  AND person_id = 'PERSON_ID_HERE'
  AND state IN ('DONE', 'REPLIED', 'SENT');

-- Expected indexes:
-- - Composite index: (user_id, person_id, state)

-- ============================================================================
-- Query 3.1: Fetch All Active Users (Weekly Summary Cron)
-- ============================================================================
EXPLAIN ANALYZE
SELECT id, email, name, email_weekly_summary, email_unsubscribed
FROM users
ORDER BY created_at DESC;

-- Expected indexes:
-- - Index on created_at if sorting is needed

-- ============================================================================
-- Query 3.2: Check for Existing Weekly Summary
-- ============================================================================
EXPLAIN ANALYZE
SELECT *
FROM weekly_summaries
WHERE user_id = 'USER_ID_HERE'
  AND week_start_date = 'DATE_HERE';

-- Expected indexes:
-- - Unique index: (user_id, week_start_date)

-- ============================================================================
-- Index Recommendations
-- ============================================================================

-- If any of the above queries show Seq Scan or slow performance, consider adding these indexes:

-- Actions table indexes:
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_actions_user_state_due_date 
--   ON actions(user_id, state, due_date);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_actions_user_person_state_due_date 
--   ON actions(user_id, person_id, state, due_date);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_actions_user_person_state 
--   ON actions(user_id, person_id, state);

-- Email metadata indexes:
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_metadata_user_person_received 
--   ON email_metadata(user_id, person_id, received_at);

-- Daily plans indexes (should already exist):
-- CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_plans_user_date 
--   ON daily_plans(user_id, date);

-- Weekly summaries indexes (should already exist):
-- CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_weekly_summaries_user_week 
--   ON weekly_summaries(user_id, week_start_date);

