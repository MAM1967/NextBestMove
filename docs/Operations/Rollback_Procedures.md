# Rollback Procedures

**Last Updated:** January 3, 2026  
**Status:** ✅ Documented

This document provides step-by-step procedures for rolling back deployments, database migrations, and environment variable changes in NextBestMove.

---

## Table of Contents

1. [When to Rollback](#when-to-rollback)
2. [Vercel Deployment Rollback](#vercel-deployment-rollback)
3. [Database Migration Rollback](#database-migration-rollback)
4. [Environment Variable Rollback](#environment-variable-rollback)
5. [Testing After Rollback](#testing-after-rollback)
6. [Communication Procedures](#communication-procedures)

---

## When to Rollback

### Decision Tree

**Rollback immediately if:**
- Error rate spikes above 5% (check Vercel Analytics or GlitchTip)
- Critical functionality is broken (authentication, billing, plan generation)
- Multiple users report the same issue
- Database errors are occurring
- Service is completely down

**Investigate first (don't rollback immediately) if:**
- Single user reports an issue
- Non-critical feature has a minor bug
- Performance degradation is minor (< 20% slower)
- Issue appears to be user-specific

**Never rollback if:**
- Issue is a data problem (requires data fix, not code rollback)
- Issue is in a third-party service (Stripe, Supabase, etc.)
- Issue is configuration-related (can be fixed without rollback)

---

## Vercel Deployment Rollback

### Method 1: Via Vercel Dashboard (Recommended)

**Steps:**

1. **Navigate to Vercel Dashboard:**
   - Go to https://vercel.com/dashboard
   - Select the **NextBestMove** project
   - Click on **Deployments** tab

2. **Identify the deployment to rollback to:**
   - Review deployment history (most recent at top)
   - Find the last known good deployment (before the problematic one)
   - Check deployment status (should be "Ready" and "Production")
   - Verify deployment timestamp and commit message

3. **Rollback to previous deployment:**
   - Click the **three dots (⋯)** menu on the target deployment
   - Select **"Promote to Production"**
   - Confirm the rollback in the dialog

4. **Verify rollback:**
   - Wait for deployment to complete (usually 1-2 minutes)
   - Check deployment status shows "Ready"
   - Test critical paths:
     - Sign in/up
     - Daily plan generation
     - Billing checkout
     - Webhook processing

5. **Monitor:**
   - Check Vercel Analytics for error rates
   - Check GlitchTip for new errors
   - Verify user reports stop

**Time to complete:** ~5 minutes

---

### Method 2: Via Vercel CLI

**Prerequisites:**
- Vercel CLI installed: `npm i -g vercel`
- Authenticated: `vercel login`

**Steps:**

1. **List recent deployments:**
   ```bash
   vercel ls nextbestmove
   ```
   This shows recent deployments with their URLs and status.

2. **Identify deployment ID:**
   - Find the deployment ID (hash) of the last known good deployment
   - Note the deployment URL or timestamp

3. **Rollback to specific deployment:**
   ```bash
   vercel rollback [deployment-url-or-id] --yes
   ```
   Example:
   ```bash
   vercel rollback https://nextbestmove-abc123.vercel.app --yes
   ```

4. **Verify rollback:**
   - Check deployment status: `vercel inspect [deployment-url]`
   - Test critical paths manually
   - Monitor error rates

**Time to complete:** ~3 minutes

---

### Method 3: Git-Based Rollback (If Vercel rollback unavailable)

**Steps:**

1. **Identify the last known good commit:**
   ```bash
   git log --oneline -10
   ```
   Find the commit hash before the problematic deployment.

2. **Create a rollback branch:**
   ```bash
   git checkout -b rollback/$(date +%Y%m%d-%H%M%S)
   git reset --hard [good-commit-hash]
   ```

3. **Push and create PR:**
   ```bash
   git push -u origin rollback/...
   ```
   Create PR to `main` (or `staging` if rolling back staging).

4. **Merge PR and deploy:**
   - Merge PR after review
   - Vercel will automatically deploy the rollback

**Time to complete:** ~10 minutes

---

## Database Migration Rollback

### Important Notes

⚠️ **Not all migrations can be rolled back safely:**
- **Safe to rollback:** Additive changes (new columns, new tables, new indexes)
- **Risky to rollback:** Data migrations, column renames, constraint changes
- **Never rollback:** Deletions of critical data, irreversible schema changes

### When Migrations Can Be Rolled Back

✅ **Safe scenarios:**
- Adding a new nullable column
- Creating a new table
- Adding a new index
- Adding a new function/view

❌ **Risky scenarios:**
- Dropping columns (data loss)
- Renaming columns (code expects new name)
- Changing column types (data conversion issues)
- Data migrations (data already transformed)

---

### Procedure: Create Rollback Script

**For each migration, create a rollback script:**

1. **Locate the migration file:**
   ```
   supabase/migrations/YYYYMMDDHHMMSS_migration_name.sql
   ```

2. **Create rollback script:**
   ```
   supabase/migrations/rollback/YYYYMMDDHHMMSS_migration_name_rollback.sql
   ```

3. **Write rollback SQL:**
   ```sql
   -- Rollback for: YYYYMMDDHHMMSS_migration_name.sql
   -- Created: [Date]
   -- Reverses: [Description of what migration did]

   -- Example: Rollback adding a column
   ALTER TABLE users DROP COLUMN IF EXISTS new_column_name;

   -- Example: Rollback creating a table
   DROP TABLE IF EXISTS new_table_name CASCADE;

   -- Example: Rollback adding an index
   DROP INDEX IF EXISTS idx_table_column;
   ```

4. **Test rollback on staging first:**
   ```bash
   # Apply rollback migration manually
   psql $DATABASE_URL -f supabase/migrations/rollback/YYYYMMDDHHMMSS_migration_name_rollback.sql
   ```

---

### Procedure: Execute Rollback

**Option 1: Via Supabase Dashboard (Recommended for Production)**

1. **Navigate to Supabase Dashboard:**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Go to **SQL Editor**

2. **Execute rollback script:**
   - Copy rollback SQL from the rollback file
   - Paste into SQL Editor
   - Review the SQL carefully
   - Click **Run** to execute

3. **Verify rollback:**
   - Check affected tables/columns are reverted
   - Verify no data loss occurred
   - Test application functionality

**Option 2: Via Supabase CLI**

1. **Connect to database:**
   ```bash
   supabase db connect
   ```

2. **Execute rollback:**
   ```bash
   psql $DATABASE_URL -f supabase/migrations/rollback/YYYYMMDDHHMMSS_migration_name_rollback.sql
   ```

3. **Verify:**
   - Check migration status: `supabase migration list`
   - Test application

---

### Critical Migration Rollback Scripts

**For critical migrations, rollback scripts should be created proactively:**

| Migration | Rollback Script | Status |
|-----------|----------------|--------|
| `20260102120000_add_action_completion_tracking.sql` | `rollback/20260102120000_add_action_completion_tracking_rollback.sql` | ⚠️ Create if needed |
| `20260102150000_add_comprehensive_email_signals.sql` | `rollback/20260102150000_add_comprehensive_email_signals_rollback.sql` | ⚠️ Create if needed |
| `20260103190933_add_action_source_fields.sql` | `rollback/20260103190933_add_action_source_fields_rollback.sql` | ⚠️ Create if needed |

**Note:** Most migrations use `IF NOT EXISTS` patterns, making them idempotent. Rollback may not be necessary if migration is idempotent.

---

## Environment Variable Rollback

### Method 1: Via Doppler (Recommended)

**Steps:**

1. **Navigate to Doppler:**
   - Go to https://dashboard.doppler.com
   - Select **NextBestMove** project
   - Select environment (Production or Preview)

2. **View change history:**
   - Click on a variable
   - View **History** tab to see previous values
   - Note the timestamp of the last good value

3. **Revert variable:**
   - Click **Edit** on the variable
   - Enter the previous value from history
   - Click **Save**

4. **Sync to Vercel:**
   ```bash
   # For production
   ./scripts/sync-doppler-to-vercel.sh

   # For staging
   ./scripts/sync-doppler-to-vercel-preview.sh
   ```

5. **Redeploy (if needed):**
   - Vercel will automatically pick up new env vars on next deployment
   - Or trigger a redeploy: `vercel --prod`

**Time to complete:** ~5 minutes

---

### Method 2: Via Vercel Dashboard

**Steps:**

1. **Navigate to Vercel:**
   - Go to https://vercel.com/dashboard
   - Select **NextBestMove** project
   - Go to **Settings** → **Environment Variables**

2. **Identify problematic variable:**
   - Review recent changes (check deployment logs)
   - Identify which variable changed recently

3. **Revert variable:**
   - Click **Edit** on the variable
   - Enter previous value (or remove if it was added)
   - Click **Save**

4. **Redeploy:**
   - Go to **Deployments** tab
   - Click **Redeploy** on latest deployment
   - Or wait for next deployment

**Time to complete:** ~3 minutes

---

### Identifying Which Env Var Caused Issues

**Check deployment logs:**
1. Go to Vercel Dashboard → Deployments
2. Click on the problematic deployment
3. Check **Build Logs** and **Function Logs** for errors
4. Look for:
   - `process.env.VARIABLE_NAME is undefined`
   - `Missing environment variable`
   - Configuration errors

**Check application logs:**
1. Go to Vercel Dashboard → Functions
2. Check recent function invocations
3. Look for errors mentioning environment variables

**Common culprits:**
- `STRIPE_WEBHOOK_SECRET` - Webhook signature verification fails
- `SUPABASE_SERVICE_ROLE_KEY` - Database connection fails
- `ENCRYPTION_KEY` - Token decryption fails
- `RESEND_API_KEY` - Email sending fails

---

## Testing After Rollback

### Critical Path Testing Checklist

After any rollback, test these critical paths:

- [ ] **Authentication:**
  - [ ] Sign up new user
  - [ ] Sign in existing user
  - [ ] Sign out

- [ ] **Onboarding:**
  - [ ] Complete onboarding flow
  - [ ] Generate first daily plan
  - [ ] Connect calendar (optional)

- [ ] **Daily Plans:**
  - [ ] Generate daily plan
  - [ ] View plan actions
  - [ ] Mark action as done

- [ ] **Billing:**
  - [ ] Create checkout session
  - [ ] Process webhook (test mode)
  - [ ] View subscription status

- [ ] **Calendar:**
  - [ ] Connect Google Calendar
  - [ ] Connect Outlook Calendar
  - [ ] View calendar events

### Monitoring After Rollback

**First 15 minutes:**
- Monitor Vercel Analytics for error rates
- Check GlitchTip for new errors
- Watch deployment logs for issues

**First hour:**
- Check user reports (if any)
- Verify critical paths still work
- Monitor database query performance

**First 24 hours:**
- Review error logs
- Check user feedback
- Verify no regression issues

---

## Communication Procedures

### Internal Communication

**When rolling back:**

1. **Notify team immediately:**
   - Post in team Slack/chat: "Rolling back deployment [deployment-id] due to [issue]"
   - Include: What was rolled back, why, and expected impact

2. **Update status:**
   - Update deployment status in project management tool
   - Mark related tickets as "Rolled back"

3. **Document the issue:**
   - Create a post-mortem document (if critical)
   - Document root cause and fix plan

### User Communication

**If users are affected:**

1. **Assess impact:**
   - How many users affected?
   - What functionality is broken?
   - Is there a workaround?

2. **Communicate (if needed):**
   - Post status update (if you have a status page)
   - Send email to affected users (if critical)
   - Update in-app banner (if applicable)

3. **Follow-up:**
   - Once fixed, communicate resolution
   - Apologize for inconvenience (if warranted)

---

## Limitations and Gotchas

### Vercel Rollback Limitations

- **Function logs:** Old function logs are not available after rollback
- **Analytics:** Historical analytics data remains unchanged
- **Edge Config:** Edge Config changes are not rolled back automatically
- **Build cache:** Build cache may cause issues if code changed significantly

### Database Rollback Limitations

- **Data loss:** Rolling back data migrations may cause data loss
- **Dependencies:** If other migrations depend on the rolled-back migration, issues may occur
- **RLS policies:** Rolling back RLS policy changes may expose security issues

### Environment Variable Rollback Limitations

- **Cached values:** Some services cache env vars (may require service restart)
- **Build-time vars:** `NEXT_PUBLIC_*` vars require rebuild
- **Secrets:** Rotated secrets cannot be "rolled back" (must generate new ones)

---

## Quick Reference

### Rollback Commands

```bash
# Vercel rollback (CLI)
vercel rollback [deployment-url] --yes

# Database rollback (Supabase CLI)
psql $DATABASE_URL -f supabase/migrations/rollback/[migration]_rollback.sql

# Sync env vars after Doppler change
./scripts/sync-doppler-to-vercel.sh  # Production
./scripts/sync-doppler-to-vercel-preview.sh  # Staging
```

### Useful Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Doppler Dashboard:** https://dashboard.doppler.com
- **GlitchTip:** [Your GlitchTip URL]

---

**Document Status:** ✅ Complete  
**Next Review:** After first production rollback

