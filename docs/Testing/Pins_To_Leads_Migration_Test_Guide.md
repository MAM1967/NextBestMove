# Pins to Leads Migration - Testing Guide

## Overview

This guide provides step-by-step instructions for testing the database migration from `person_pins` to `leads`.

---

## Pre-Testing Checklist

- [ ] Migration file has been applied to the database
- [ ] You have access to the Supabase SQL Editor or database CLI
- [ ] You have a test user account with some existing data (optional, but recommended)

---

## Step 1: Run Verification Script

Run the verification script to check all database objects:

```bash
# In Supabase SQL Editor, run:
# File: verify_pins_to_leads_migration.sql
```

**Expected Results:**
- ✅ All checks should show "PASS"
- ✅ No orphaned records in foreign key checks
- ✅ All functions reference `leads` table (not `person_pins`)

---

## Step 2: Manual Database Tests

### Test 2.1: Basic CRUD Operations

**Test INSERT:**
```sql
-- Insert a new lead (replace user_id with a real UUID)
INSERT INTO leads (user_id, name, url, status)
VALUES (
  'YOUR_USER_ID_HERE',
  'Test Lead',
  'https://linkedin.com/in/test-lead',
  'ACTIVE'
)
RETURNING *;
```

**Expected:** Should insert successfully with `lead_status` enum.

---

**Test SELECT:**
```sql
-- Select all leads for a user
SELECT * FROM leads 
WHERE user_id = 'YOUR_USER_ID_HERE'
LIMIT 10;
```

**Expected:** Should return leads with correct status values.

---

**Test UPDATE:**
```sql
-- Update lead status
UPDATE leads 
SET status = 'SNOOZED', snooze_until = CURRENT_DATE + INTERVAL '7 days'
WHERE name = 'Test Lead'
RETURNING *;
```

**Expected:** Should update successfully using `lead_status` enum.

---

**Test DELETE:**
```sql
-- Delete test lead
DELETE FROM leads 
WHERE name = 'Test Lead'
RETURNING *;
```

**Expected:** Should delete successfully.

---

### Test 2.2: Foreign Key Relationships

**Test Actions → Leads:**
```sql
-- Check that actions can reference leads
SELECT 
  a.id as action_id,
  a.description,
  l.name as lead_name,
  l.status as lead_status
FROM actions a
LEFT JOIN leads l ON l.id = a.person_id
WHERE a.user_id = 'YOUR_USER_ID_HERE'
LIMIT 10;
```

**Expected:** Should join successfully, showing lead names and statuses.

---

**Test Pre-Call Briefs → Leads:**
```sql
-- Check that pre_call_briefs can reference leads
SELECT 
  pcb.id as brief_id,
  pcb.event_title,
  l.name as lead_name,
  l.status as lead_status
FROM pre_call_briefs pcb
LEFT JOIN leads l ON l.id = pcb.person_pin_id
WHERE pcb.user_id = 'YOUR_USER_ID_HERE'
LIMIT 10;
```

**Expected:** Should join successfully, showing lead names and statuses.

---

### Test 2.3: RLS (Row Level Security) Policies

**Test as Authenticated User:**
```sql
-- This should work if you're authenticated
SELECT COUNT(*) FROM leads;
```

**Expected:** Should return count of leads for the authenticated user only.

---

**Test Policy Enforcement:**
```sql
-- Try to insert a lead for a different user (should fail)
-- Replace with a different user_id
INSERT INTO leads (user_id, name, url, status)
VALUES (
  'DIFFERENT_USER_ID',
  'Unauthorized Lead',
  'https://example.com',
  'ACTIVE'
);
```

**Expected:** Should fail with RLS policy violation (if RLS is properly configured).

---

### Test 2.4: Functions

**Test auto_unsnooze_items():**
```sql
-- Create a snoozed lead that should be unsnoozed
INSERT INTO leads (user_id, name, url, status, snooze_until)
VALUES (
  'YOUR_USER_ID_HERE',
  'Snoozed Test Lead',
  'https://example.com',
  'SNOOZED',
  CURRENT_DATE - INTERVAL '1 day'  -- Past date, should be unsnoozed
);

-- Trigger the function by updating an action
UPDATE actions 
SET snooze_until = CURRENT_DATE - INTERVAL '1 day'
WHERE user_id = 'YOUR_USER_ID_HERE'
LIMIT 1;

-- Check if lead was unsnoozed
SELECT name, status, snooze_until 
FROM leads 
WHERE name = 'Snoozed Test Lead';
```

**Expected:** Lead status should be 'ACTIVE' and `snooze_until` should be NULL.

---

**Test detect_warm_reengagement_pattern():**
```sql
-- Test the pattern detection function
SELECT * FROM detect_warm_reengagement_pattern('YOUR_USER_ID_HERE');
```

**Expected:** Should return results (or zero values if not enough data) without errors.

---

### Test 2.5: Indexes

**Test Query Performance:**
```sql
-- These queries should use indexes
EXPLAIN ANALYZE
SELECT * FROM leads 
WHERE user_id = 'YOUR_USER_ID_HERE' 
  AND status = 'ACTIVE';

EXPLAIN ANALYZE
SELECT * FROM leads 
WHERE user_id = 'YOUR_USER_ID_HERE' 
  AND status = 'SNOOZED' 
  AND snooze_until <= CURRENT_DATE;
```

**Expected:** Should show index usage in the query plan.

---

## Step 3: Application-Level Tests

After verifying the database, test the application:

### Test 3.1: API Endpoints (Before Frontend Changes)

**Note:** These will fail until we update the API endpoints in Phase 3, but we can verify the database is ready.

**Test GET /api/pins (will fail, but check error):**
```bash
curl -X GET http://localhost:3000/api/pins \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Should return an error about table not found (until we update the API).

---

### Test 3.2: Direct Database Queries from Application

If you have database access from the application, test:

```typescript
// This should work after migration
const { data, error } = await supabase
  .from('leads')
  .select('*')
  .eq('user_id', userId)
  .limit(10);

console.log('Leads:', data);
```

**Expected:** Should return leads data without errors.

---

## Step 4: Data Integrity Verification

### Check for Orphaned Records

```sql
-- Check for actions pointing to non-existent leads
SELECT COUNT(*) as orphaned_actions
FROM actions a
WHERE a.person_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM leads l WHERE l.id = a.person_id
  );

-- Check for pre_call_briefs pointing to non-existent leads
SELECT COUNT(*) as orphaned_briefs
FROM pre_call_briefs pcb
WHERE pcb.person_pin_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM leads l WHERE l.id = pcb.person_pin_id
  );
```

**Expected:** Both should return 0 (no orphaned records).

---

### Verify Data Counts

```sql
-- Compare counts before/after (if you have a backup)
-- This is just to ensure no data was lost
SELECT 
  'leads' as table_name,
  COUNT(*) as record_count
FROM leads
UNION ALL
SELECT 
  'actions with leads',
  COUNT(*)
FROM actions
WHERE person_id IS NOT NULL
UNION ALL
SELECT 
  'pre_call_briefs with leads',
  COUNT(*)
FROM pre_call_briefs
WHERE person_pin_id IS NOT NULL;
```

**Expected:** Counts should match your expectations (no data loss).

---

## Step 5: Rollback Test (Optional)

If you need to rollback, you would need to:

1. **Revert the migration** (rename back):
   ```sql
   ALTER TABLE leads RENAME TO person_pins;
   ALTER TYPE lead_status RENAME TO pin_status;
   -- ... etc (reverse all changes)
   ```

2. **Or restore from backup** (recommended)

**Note:** Only test rollback if you're on a staging/test database.

---

## Common Issues & Solutions

### Issue: "relation 'person_pins' does not exist"

**Cause:** Migration ran successfully, but application code still references old table.

**Solution:** This is expected. We'll fix this in Phase 3 (API endpoints).

---

### Issue: "type 'pin_status' does not exist"

**Cause:** Migration ran successfully, but application code still references old enum.

**Solution:** This is expected. We'll fix this in Phase 2 (TypeScript types).

---

### Issue: Foreign key constraint errors

**Cause:** Orphaned records or constraint not properly updated.

**Solution:** Run the verification script to check for orphaned records. If found, investigate and fix.

---

### Issue: RLS policies not working

**Cause:** Policies may not have been updated correctly.

**Solution:** Check policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'leads';
```

Should show policies with "lead" in the name.

---

## Success Criteria

✅ All verification script checks pass  
✅ Basic CRUD operations work on `leads` table  
✅ Foreign keys work correctly  
✅ RLS policies enforce correctly  
✅ Functions reference `leads` table  
✅ No orphaned records  
✅ No data loss  
✅ Indexes are being used  

---

## Next Steps

Once all tests pass:

1. ✅ **Phase 1 Complete:** Database migration verified
2. ➡️ **Phase 2:** Update TypeScript types
3. ➡️ **Phase 3:** Update API endpoints
4. ➡️ **Phase 4:** Update UI components
5. ➡️ **Phase 5:** Update documentation
6. ➡️ **Phase 6:** Code cleanup

---

**Last Updated:** 2025-12-04

