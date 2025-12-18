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
   - **URGENT:** Fixed early access form role constraint mismatch

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

## Step 2: Apply Database Migrations

**IMPORTANT:** Run these SQL scripts against the **PRODUCTION** Supabase database.

### Migration 1: Calendar Trigger Fix

**Script:** `scripts/apply-production-migration.sql`

**What it does:**

- Fixes the `update_user_calendar_status()` trigger function
- Handles DELETE operations on `calendar_connections` table
- Ensures `users.calendar_connected` flag updates correctly when calendars are disconnected

### Migration 2: Early Access Form Role Constraint Fix ⚠️ URGENT

**Script:** `scripts/fix-production-early-access-role.sql`

**What it does:**

- Fixes role constraint mismatch that's causing form submission errors
- Updates database constraint to match form options:
  - Old: `fractional_cmo`, `consultant` (don't match form)
  - New: `fractional_executive`, `solopreneur`, `independent_consultant` (match form)
- Migrates any existing records with old role values

**Why this is urgent:** The early access form is currently broken in production because the database rejects valid form submissions.

### How to Apply Migrations

#### Option A: Via Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your **production** project
3. Navigate to **SQL Editor**
4. Run **Migration 1** first:
   - Copy and paste contents of `scripts/apply-production-migration.sql`
   - Click **Run**
5. Run **Migration 2** (URGENT):
   - Copy and paste contents of `scripts/fix-production-early-access-role.sql`
   - Click **Run**

#### Option B: Via Supabase CLI

```bash
# Set production database connection string
export SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Run migrations in order
psql $SUPABASE_DB_URL -f scripts/apply-production-migration.sql
psql $SUPABASE_DB_URL -f scripts/fix-production-early-access-role.sql
```

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

5. **Test Early Access Form** ⚠️
   - Submit the early access form on the marketing page
   - Verify it accepts all role options (Fractional Executive, Solopreneur, Independent consultant, Agency, Other)
   - Verify submission succeeds and confirmation email is sent

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
