# Production Deployment Instructions

## Date: 2025-12-16

## Changes Being Deployed

1. **Calendar OAuth Token Refresh Stability**
   - Added 401 error handling and automatic retry logic
   - Implemented refresh token rotation for Google and Microsoft
   - Improved error messages and logging

2. **Weekly Summary Date Fixes**
   - Fixed weekly summary to use previous week's Sunday (Sunday-Saturday week structure)
   - Fixed generate endpoint to match cron job logic

3. **UI Language Refactor**
   - Updated navigation and terminology (CRM → "Do the Work" language)
   - Renamed "Weekly Summary" to "Weekly Review"
   - Updated "streak" to "consecutive days" / "activity"

4. **Actions Screen IA Improvements**
   - Single-column layout with 4 priority sections
   - Verb-led action rows
   - Improved visual hierarchy

5. **Bug Fixes**
   - Fixed account email display (login credentials vs OAuth email)
   - Fixed calendar_connected trigger to handle DELETE operations

---

## Step 1: Deploy Code to Production

Run these commands to merge staging into main and push to production:

```bash
cd /Users/michaelmcdermott/NextBestMove

# Ensure you're on staging and it's up to date
git checkout staging
git pull origin staging

# Switch to main (or create a new branch from main if worktree issue)
git checkout main
git pull origin main

# Merge staging into main
git merge staging --no-edit

# Run type check before deploying
cd web
npm run type-check
cd ..

# Push to production (this will trigger Vercel deployment)
git push origin main
```

**Alternative: Use the deployment script (requires interactive confirmation):**
```bash
./scripts/deploy-production.sh "Deploy: Calendar OAuth stability improvements, weekly summary date fixes, and UI language refactor"
```

---

## Step 2: Apply Database Migration

**IMPORTANT:** Run this SQL script against the **PRODUCTION** Supabase database.

### Option A: Via Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your **production** project
3. Navigate to **SQL Editor**
4. Copy and paste the contents of `scripts/apply-production-migration.sql`
5. Click **Run** to execute

### Option B: Via Supabase CLI

```bash
# Set production database connection string
export SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Run the migration
psql $SUPABASE_DB_URL -f scripts/apply-production-migration.sql
```

### Migration Script Location

The migration script is located at:
```
scripts/apply-production-migration.sql
```

### What This Migration Does

- **Fixes the `update_user_calendar_status()` trigger function**
- **Handles DELETE operations** on `calendar_connections` table
- **Ensures `users.calendar_connected` flag updates correctly** when calendars are disconnected

### Verification

After running the migration, verify it worked:

```sql
-- Check that the function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'update_user_calendar_status';

-- Check that the trigger is attached
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE proname = 'update_user_calendar_status'
  AND tgrelid = 'calendar_connections'::regclass;
```

---

## Step 3: Verify Deployment

1. **Check Vercel Deployment**
   - Monitor at: https://vercel.com/dashboard
   - Ensure build completes successfully
   - Verify production URL is accessible

2. **Test Calendar Connection**
   - Connect a calendar (Google or Microsoft)
   - Disconnect the calendar
   - Verify `calendar_connected` flag updates correctly in database

3. **Test Weekly Review**
   - Generate a weekly review
   - Verify it shows the correct previous week's date range

4. **Test Token Refresh**
   - Calendar connections should automatically refresh tokens
   - Check logs for successful token refresh operations

---

## Rollback Plan (If Needed)

If issues occur, you can rollback:

```bash
# Revert to previous main commit
git checkout main
git reset --hard [previous-commit-hash]
git push origin main --force

# Revert database migration (if needed)
-- Run the original trigger function from initial_schema.sql
```

---

## Notes

- **No data migration required** - this is a code-only deployment with a trigger function fix
- **Zero downtime** - the trigger function replacement is atomic
- **Backward compatible** - all changes are backward compatible

