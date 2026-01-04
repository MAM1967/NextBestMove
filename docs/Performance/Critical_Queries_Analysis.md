# Critical Queries Performance Analysis

**Last Updated:** January 3, 2026  
**Status:** 🔄 In Progress

This document tracks performance analysis of critical database queries in NextBestMove.

---

## Analysis Methodology

1. Run `EXPLAIN ANALYZE` on each critical query
2. Document execution plan and timing
3. Identify slow operations (Seq Scan, expensive joins, missing indexes)
4. Optimize queries and add indexes as needed
5. Re-test and document improvements

---

## Critical Queries

### 1. Daily Plan Generation Queries

**Location:** `web/src/lib/plans/generate-daily-plan.ts`

#### Query 1.1: Fetch Candidate Actions
```sql
SELECT 
  *,
  leads!actions_person_id_fkey (
    id, name, linkedin_url, email, phone_number, url, notes, created_at
  )
FROM actions
WHERE user_id = $1
  AND state IN ('NEW', 'SNOOZED')
  AND due_date <= $2
ORDER BY due_date ASC, created_at DESC;
```

**Status:** ⏱ Pending Analysis  
**Target:** < 100ms for users with < 100 actions  
**Indexes:**
- ✅ `idx_actions_user_state_due_date` (if exists)
- ⚠️ Check if composite index needed: `(user_id, state, due_date)`

**Analysis:**
- [ ] Run EXPLAIN ANALYZE
- [ ] Document execution plan
- [ ] Check for Seq Scans
- [ ] Verify index usage

---

#### Query 1.2: Check Existing Plan
```sql
SELECT id, capacity_override, override_reason
FROM daily_plans
WHERE user_id = $1 AND date = $2;
```

**Status:** ⏱ Pending Analysis  
**Target:** < 50ms  
**Indexes:**
- ✅ Should have: `(user_id, date)` unique index

**Analysis:**
- [ ] Run EXPLAIN ANALYZE
- [ ] Document execution plan

---

#### Query 1.3: Decision Engine Scoring
**Location:** `web/src/lib/decision-engine/`

**Status:** ⏱ Pending Analysis  
**Note:** Complex query involving multiple tables and calculations

**Analysis:**
- [ ] Identify all queries in decision engine
- [ ] Run EXPLAIN ANALYZE on each
- [ ] Document slow operations

---

### 2. Decision Engine - Best Action Selection

**Location:** `web/src/app/api/decision-engine/best-action/route.ts`

#### Query 2.1: Get Best Action
**Status:** ⏱ Pending Analysis  
**Note:** Uses decision engine which may involve multiple queries

**Analysis:**
- [ ] Trace full query path
- [ ] Run EXPLAIN ANALYZE
- [ ] Document execution plan

---

#### Query 2.2: Fetch Action with Relationship Data
```sql
SELECT 
  *,
  leads (id, name, url, notes, tier, last_interaction_at, relationship_state)
FROM actions
WHERE id = $1;
```

**Status:** ⏱ Pending Analysis  
**Target:** < 50ms

**Analysis:**
- [ ] Run EXPLAIN ANALYZE
- [ ] Check join performance
- [ ] Verify foreign key index usage

---

#### Query 2.3: Count Overdue Actions
```sql
SELECT COUNT(*)
FROM actions
WHERE user_id = $1
  AND person_id = $2
  AND state = 'NEW'
  AND due_date < CURRENT_DATE;
```

**Status:** ⏱ Pending Analysis  
**Target:** < 50ms

**Indexes:**
- ⚠️ Check if index needed: `(user_id, person_id, state, due_date)`

**Analysis:**
- [ ] Run EXPLAIN ANALYZE
- [ ] Document execution plan

---

#### Query 2.4: Fetch Recent Email Metadata
```sql
SELECT sentiment
FROM email_metadata
WHERE user_id = $1
  AND person_id = $2
  AND received_at >= $3
ORDER BY received_at DESC
LIMIT 5;
```

**Status:** ⏱ Pending Analysis  
**Target:** < 100ms

**Indexes:**
- ⚠️ Check if index needed: `(user_id, person_id, received_at)`

**Analysis:**
- [ ] Run EXPLAIN ANALYZE
- [ ] Document execution plan

---

### 3. Weekly Summary Generation

**Location:** `web/src/app/api/cron/weekly-summaries/route.ts`

#### Query 3.1: Fetch All Active Users
```sql
SELECT id, email, name, email_weekly_summary, email_unsubscribed
FROM users
ORDER BY created_at DESC;
```

**Status:** ⏱ Pending Analysis  
**Target:** < 200ms for < 1000 users

**Analysis:**
- [ ] Run EXPLAIN ANALYZE
- [ ] Document execution plan

---

#### Query 3.2: Aggregate Weekly Metrics
**Status:** ⏱ Pending Analysis  
**Note:** Complex aggregation query - needs detailed analysis

**Analysis:**
- [ ] Identify all aggregation queries
- [ ] Run EXPLAIN ANALYZE on each
- [ ] Check for missing indexes on date columns

---

### 4. Actions Filtering Queries

**Location:** `web/src/app/api/actions/filtered/route.ts`

#### Query 4.1: Filter Actions by State/Type
**Status:** ⏱ Pending Analysis

**Analysis:**
- [ ] Identify query structure
- [ ] Run EXPLAIN ANALYZE
- [ ] Document execution plan

---

## Slow Query Thresholds

- **Warning:** > 500ms
- **Critical:** > 1000ms
- **Target:** < 200ms for most queries

---

## Optimization Opportunities

### Missing Indexes (To Verify)

1. **Actions Table:**
   - [ ] Composite index: `(user_id, state, due_date)`
   - [ ] Index: `(user_id, person_id, state, due_date)` for relationship queries

2. **Email Metadata Table:**
   - [ ] Composite index: `(user_id, person_id, received_at)`

3. **Daily Plans Table:**
   - [ ] Verify unique index: `(user_id, date)`

4. **Leads Table:**
   - [ ] Verify indexes on: `(user_id, status)`, `(user_id, tier)`

### Query Optimizations (To Implement)

1. [ ] Add query result caching for frequently accessed data
2. [ ] Optimize N+1 query patterns (if found)
3. [ ] Add query result pagination where appropriate
4. [ ] Consider materialized views for complex aggregations

---

## Testing Scripts

### Run EXPLAIN ANALYZE

Create SQL scripts in `docs/Performance/` to run EXPLAIN ANALYZE on each critical query.

Example:
```sql
-- Query 1.1: Candidate Actions
EXPLAIN ANALYZE
SELECT 
  *,
  leads!actions_person_id_fkey (
    id, name, linkedin_url, email, phone_number, url, notes, created_at
  )
FROM actions
WHERE user_id = 'USER_ID_HERE'
  AND state IN ('NEW', 'SNOOZED')
  AND due_date <= CURRENT_DATE
ORDER BY due_date ASC, created_at DESC;
```

---

## Performance Baseline

**Target Metrics:**
- Daily plan generation: < 500ms (per PRD)
- Best action selection: < 200ms
- Weekly summary generation: < 30s total (for all users)
- Action filtering: < 100ms

**Current Status:** ⏱ Baseline not yet established

---

## Next Steps

1. [ ] Run EXPLAIN ANALYZE on all critical queries
2. [ ] Document execution plans and timings
3. [ ] Identify slow queries (> 500ms)
4. [ ] Create database migrations for missing indexes
5. [ ] Re-test after optimizations
6. [ ] Update this document with results

---

## Notes

- Use `CREATE INDEX CONCURRENTLY` for production indexes to avoid locks
- Test all index additions on staging first
- Monitor query performance after index additions
- Consider query result caching for expensive queries

