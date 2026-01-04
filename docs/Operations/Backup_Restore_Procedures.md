# Database Backup & Restore Procedures

**Last Updated:** January 3, 2026  
**Status:** ⚠️ Verification Required

This document describes Supabase backup settings, verification procedures, and restore processes for NextBestMove.

---

## Table of Contents

1. [Backup Settings Verification](#backup-settings-verification)
2. [Backup Schedule & Retention](#backup-schedule--retention)
3. [Restore Procedure](#restore-procedure)
4. [Backup Monitoring](#backup-monitoring)
5. [Monthly Verification Checklist](#monthly-verification-checklist)

---

## Backup Settings Verification

### Current Settings (To Be Verified)

**Expected Configuration:**
- **Backup Frequency:** Daily
- **Retention Policy:** 7 days minimum (30 days recommended)
- **Backup Storage:** Supabase managed (automated)
- **Point-in-Time Recovery:** Available (if enabled)

### Verification Steps

1. **Log into Supabase Dashboard:**
   - Go to https://supabase.com/dashboard
   - Select **NextBestMove** project
   - Navigate to **Settings** → **Database** → **Backups**

2. **Check Backup Settings:**
   - Verify **Daily backups** are enabled
   - Check **Retention period** (should be 7+ days)
   - Note **Backup storage location**
   - Verify **Point-in-Time Recovery** status (if available)

3. **Document Current Settings:**
   - Record backup frequency
   - Record retention period
   - Record last backup timestamp
   - Record backup storage location

4. **Verify Backup History:**
   - Check **Backup History** tab
   - Verify recent backups exist (should see daily backups)
   - Check backup sizes (should be consistent)
   - Verify no failed backups

### Expected Results

✅ **Backups should show:**
- Daily backups for the last 7+ days
- Consistent backup sizes (within 10% variance)
- All backups marked as "Success"
- Recent backup within last 24 hours

❌ **Red flags:**
- Missing backups
- Failed backup status
- Backup sizes dropping significantly (possible data loss)
- No backups in last 48 hours

---

## Backup Schedule & Retention

### Current Schedule

**Production Database:**
- **Frequency:** Daily (automated by Supabase)
- **Time:** Typically runs during low-traffic hours (varies by region)
- **Retention:** [To be verified - target: 7-30 days]

**Staging Database:**
- **Frequency:** Daily (automated by Supabase)
- **Retention:** [To be verified - target: 7 days]

### Backup Types

1. **Full Database Backup:**
   - Complete database snapshot
   - Includes all tables, data, indexes, functions
   - Used for full restore

2. **Point-in-Time Recovery (if enabled):**
   - Allows restore to specific timestamp
   - Requires WAL (Write-Ahead Log) archiving
   - More granular recovery options

### Retention Policy

**Recommended:**
- **Production:** 30 days retention
- **Staging:** 7 days retention

**Rationale:**
- 30 days allows recovery from issues discovered weeks later
- 7 days for staging is sufficient (less critical data)

---

## Restore Procedure

### ⚠️ CRITICAL: Never Test Restore on Production

**Always test restore procedures on staging database first.**

---

### Procedure: Test Restore on Staging

**Purpose:** Verify restore procedure works correctly without affecting production.

**Steps:**

1. **Identify staging database:**
   - Go to Supabase Dashboard
   - Select **Staging** project (or create test project)
   - Note database connection string

2. **Create test backup point:**
   - Note current timestamp: `[TIMESTAMP]`
   - Verify backup exists for this time
   - Document backup ID: `[BACKUP_ID]`

3. **Make a test change (to verify restore works):**
   ```sql
   -- Create a test table to verify restore
   CREATE TABLE restore_test (
     id SERIAL PRIMARY KEY,
     test_data TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   INSERT INTO restore_test (test_data) VALUES ('Before restore');
   ```

4. **Initiate restore:**
   - Go to **Settings** → **Database** → **Backups**
   - Find the backup from step 2
   - Click **Restore** (or use Supabase CLI)
   - Select restore target (staging database)
   - Confirm restore

5. **Wait for restore to complete:**
   - Restore typically takes 5-15 minutes
   - Monitor restore progress in dashboard
   - Do not interrupt restore process

6. **Verify restore:**
   ```sql
   -- Check that test table is gone (restored to before creation)
   SELECT * FROM restore_test;
   -- Should return: relation "restore_test" does not exist
   
   -- Verify critical tables exist and have data
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM actions;
   SELECT COUNT(*) FROM daily_plans;
   SELECT COUNT(*) FROM billing_subscriptions;
   
   -- Verify data integrity
   SELECT 
     (SELECT COUNT(*) FROM users) as user_count,
     (SELECT COUNT(*) FROM actions) as action_count,
     (SELECT COUNT(*) FROM daily_plans) as plan_count;
   ```

7. **Verify relationships:**
   ```sql
   -- Check foreign key relationships
   SELECT COUNT(*) 
   FROM actions a
   INNER JOIN users u ON a.user_id = u.id;
   
   SELECT COUNT(*) 
   FROM daily_plans dp
   INNER JOIN users u ON dp.user_id = u.id;
   
   SELECT COUNT(*) 
   FROM billing_subscriptions bs
   INNER JOIN billing_customers bc ON bs.billing_customer_id = bc.id;
   ```

8. **Document restore time:**
   - Record time taken for restore
   - Note any issues encountered
   - Update this document with findings

**Expected Results:**
- Restore completes successfully
- All critical tables exist
- Data counts match pre-restore state
- Relationships are intact
- Restore time: 5-15 minutes

---

### Procedure: Production Restore (Emergency Only)

**⚠️ WARNING: Production restore will cause downtime and data loss.**

**Only perform in emergency situations:**
- Critical data corruption
- Accidental mass deletion
- Security breach requiring clean state

**Steps:**

1. **Assess the situation:**
   - Determine if restore is necessary
   - Identify the last known good backup timestamp
   - Calculate data loss (time between backup and issue)
   - Get approval from team lead

2. **Notify stakeholders:**
   - Post in team chat: "Initiating production database restore"
   - Set maintenance mode (if available)
   - Notify users (if downtime expected)

3. **Stop application writes (if possible):**
   - Disable new user signups (via feature flag)
   - Pause cron jobs
   - Stop background workers

4. **Create current backup (if possible):**
   - Manually trigger backup before restore
   - This preserves current state (in case restore fails)

5. **Initiate restore:**
   - Go to Supabase Dashboard → **Settings** → **Database** → **Backups**
   - Select backup from before the issue
   - Click **Restore**
   - Confirm restore (this will overwrite current database)

6. **Wait for restore:**
   - Monitor restore progress
   - Do not interrupt
   - Typical time: 10-30 minutes

7. **Verify restore:**
   - Run verification queries (see staging restore steps)
   - Check critical paths:
     - User authentication
     - Daily plan generation
     - Billing webhooks
   - Verify data integrity

8. **Resume operations:**
   - Re-enable application writes
   - Restart cron jobs
   - Remove maintenance mode
   - Monitor for issues

9. **Post-restore tasks:**
   - Document what was restored and why
   - Identify root cause of issue
   - Implement prevention measures
   - Update monitoring/alerts

---

## Backup Monitoring

### Automated Monitoring

**Current Status:** ⚠️ Not yet configured

**Recommended Setup:**

1. **Supabase Dashboard Alerts:**
   - Enable email notifications for backup failures
   - Set up alerts for missing backups
   - Configure alerts for backup size anomalies

2. **Custom Monitoring (Future):**
   - Query Supabase API for backup status
   - Set up cron job to check backup health
   - Alert if backup missing for 24+ hours

### Manual Verification Process

**Weekly Check (Every Monday):**

1. Log into Supabase Dashboard
2. Go to **Settings** → **Database** → **Backups**
3. Verify:
   - [ ] Backups exist for last 7 days
   - [ ] All backups marked "Success"
   - [ ] Backup sizes are consistent
   - [ ] Most recent backup within last 24 hours

4. Document findings:
   - Record backup count
   - Note any issues
   - Update this document if settings change

**Monthly Check (First Monday of Month):**

1. Perform weekly check (above)
2. Review backup retention policy
3. Verify restore procedure (test on staging)
4. Update documentation if needed

---

## Monthly Verification Checklist

**Perform on first Monday of each month:**

- [ ] **Backup Settings:**
  - [ ] Verify daily backups enabled
  - [ ] Check retention period (should be 7+ days)
  - [ ] Verify backup storage location

- [ ] **Backup History:**
  - [ ] Check last 30 days of backups exist
  - [ ] Verify all backups successful
  - [ ] Check backup sizes are consistent
  - [ ] Note any anomalies

- [ ] **Restore Test (Staging):**
  - [ ] Perform test restore on staging
  - [ ] Verify data integrity after restore
  - [ ] Document restore time
  - [ ] Note any issues

- [ ] **Documentation:**
  - [ ] Update this document with findings
  - [ ] Record backup settings if changed
  - [ ] Document any issues encountered

**Last Verification:** [Date]  
**Next Verification:** [Date + 1 month]  
**Verified By:** [Name]

---

## Backup Storage Details

### Current Configuration

**Storage Location:** Supabase managed (automated)  
**Storage Type:** [To be verified]  
**Backup Format:** PostgreSQL dump  
**Compression:** [To be verified]

### Backup Size Estimates

**Production Database:**
- Current size: [To be verified]
- Average backup size: [To be verified]
- Growth rate: [To be monitored]

**Staging Database:**
- Current size: [To be verified]
- Average backup size: [To be verified]

---

## Troubleshooting

### Backup Not Appearing

**Possible causes:**
1. Backup job failed (check Supabase logs)
2. Backup retention expired (backup was deleted)
3. Dashboard not refreshing (refresh page)

**Actions:**
- Check Supabase status page
- Contact Supabase support if persistent
- Verify backup settings are correct

### Restore Fails

**Possible causes:**
1. Backup file corrupted
2. Insufficient permissions
3. Database connection issues

**Actions:**
- Try restoring from different backup
- Check Supabase status
- Contact Supabase support

### Backup Size Anomalies

**Possible causes:**
1. Data growth (expected)
2. Data corruption (unexpected)
3. Backup compression changes

**Actions:**
- Compare to previous backups
- Check database size directly
- Investigate if significant change

---

## Quick Reference

### Verification Commands

```sql
-- Check database size
SELECT 
  pg_size_pretty(pg_database_size(current_database())) as db_size;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Count records in critical tables
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'actions', COUNT(*) FROM actions
UNION ALL
SELECT 'daily_plans', COUNT(*) FROM daily_plans
UNION ALL
SELECT 'billing_subscriptions', COUNT(*) FROM billing_subscriptions;
```

### Useful Links

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Supabase Backups Docs:** https://supabase.com/docs/guides/platform/backups
- **Supabase Support:** [Contact via dashboard]

---

## Next Steps

1. **Immediate:**
   - [ ] Verify backup settings in Supabase dashboard
   - [ ] Document current backup configuration
   - [ ] Test restore procedure on staging

2. **Short-term:**
   - [ ] Set up backup monitoring alerts
   - [ ] Create monthly verification schedule
   - [ ] Document backup sizes and growth

3. **Long-term:**
   - [ ] Consider point-in-time recovery (if not enabled)
   - [ ] Implement automated backup verification
   - [ ] Set up off-site backup (if required)

---

**Document Status:** ⚠️ Verification Required  
**Action Required:** Verify backup settings in Supabase dashboard and update this document

