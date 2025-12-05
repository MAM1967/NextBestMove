# Phase 1.7: Cron Jobs Staging Setup

**Goal:** Configure cron jobs for staging environment

**Current Setup:** Using cron-job.org for all cron jobs

---

## Overview

All cron jobs need to be configured separately for staging with:

- Staging URLs (`https://staging.nextbestmove.app`)
- Staging `CRON_SECRET` (different from production)
- Same `CRON_JOB_ORG_API_KEY` (can be shared)

---

## Step 1: Generate Staging CRON_SECRET

Generate a unique secret for staging (different from production):

```bash
openssl rand -hex 32
```

Save this value - you'll need it for:

1. Vercel environment variables (Preview scope)
2. cron-job.org job URLs

---

## Step 2: Add CRON_SECRET to Vercel

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Add `CRON_SECRET`:

   - **Key:** `CRON_SECRET`
   - **Value:** `[your-generated-staging-secret]`
   - **Environment:** **Preview** only (NOT Production)
   - Click **Save**

3. Verify `CRON_JOB_ORG_API_KEY`:
   - Should already exist (can be shared between production and staging)
   - If not, add it with **Preview** scope

---

## Step 3: Configure Cron Jobs in cron-job.org

For each cron job, create a separate job for staging:

### Cron Job List

| Job Name                     | Endpoint                                   | Schedule            | Description                        |
| ---------------------------- | ------------------------------------------ | ------------------- | ---------------------------------- |
| **Daily Plans**              | `/api/cron/daily-plans`                    | Daily at 6 AM UTC   | Generate daily plans for all users |
| **Weekly Summaries**         | `/api/cron/weekly-summaries`               | Sunday 11:59 PM UTC | Generate weekly summaries          |
| **Streak Recovery**          | `/api/cron/streak-recovery`                | Daily at 8 AM UTC   | Send streak recovery emails        |
| **Payment Failure Recovery** | `/api/cron/payment-failure-recovery`       | Daily at 9 AM UTC   | Handle payment failures            |
| **Win-Back Campaign**        | `/api/cron/win-back-campaign`              | Daily at 10 AM UTC  | Send win-back emails               |
| **Trial Reminders**          | `/api/cron/trial-reminders`                | Daily at 11 AM UTC  | Send trial reminder emails         |
| **Auto-Unsnooze**            | `/api/cron/auto-unsnooze`                  | Daily at 12 PM UTC  | Auto-unsnooze expired actions      |
| **Auto-Archive**             | `/api/cron/auto-archive`                   | Daily at 1 PM UTC   | Auto-archive old actions           |
| **Performance Timeline**     | `/api/cron/aggregate-performance-timeline` | Daily at 2 PM UTC   | Aggregate performance data         |
| **Morning Plan Email**       | `/api/notifications/morning-plan`          | Daily at 8 AM UTC   | Send morning plan emails           |
| **Fast Win Reminder**        | `/api/notifications/fast-win-reminder`     | Daily at 2 PM UTC   | Send fast win reminders            |
| **Follow-Up Alerts**         | `/api/notifications/follow-up-alerts`      | Daily at 3 PM UTC   | Send follow-up alerts              |

---

## Step 4: Create Staging Cron Jobs

For each job above, create a new job in cron-job.org:

1. **Go to cron-job.org:**

   - Log in to your account
   - Go to **Cron Jobs** → **Add Cron Job**

2. **Configure each job:**

   - **Title:** `[STAGING] [Job Name]` (e.g., "STAGING Daily Plans")
   - **URL:** `https://staging.nextbestmove.app/api/cron/[endpoint]?secret=[STAGING_CRON_SECRET]`
     - ⚠️ **CRITICAL:** Must use `https://` (NOT `http://`)
     - Vercel redirects HTTP to HTTPS with a 308, but cron-job.org doesn't follow redirects
     - This will cause "308 Permanent Redirect" errors if you use HTTP
   - **Schedule:** Same as production (see table above)
   - **Request Method:** GET
   - **Request Headers:**
     - `Authorization: Bearer [CRON_JOB_ORG_API_KEY]` (optional, but recommended)
   - **Save**

3. **Example URLs (ALL must use HTTPS):**

   ```
   ✅ https://staging.nextbestmove.app/api/cron/daily-plans?secret=YOUR_STAGING_SECRET
   ✅ https://staging.nextbestmove.app/api/cron/weekly-summaries?secret=YOUR_STAGING_SECRET
   ✅ https://staging.nextbestmove.app/api/cron/streak-recovery?secret=YOUR_STAGING_SECRET

   ❌ http://staging.nextbestmove.app/api/cron/streak-recovery?secret=... (WRONG - will cause 308 error)
   ```

---

## Step 5: Test Each Cron Endpoint

Test each endpoint manually to verify they work:

### Test Command Template

```bash
curl -X GET "https://staging.nextbestmove.app/api/cron/[endpoint]?secret=YOUR_STAGING_SECRET" \
  -H "Authorization: Bearer YOUR_CRON_JOB_ORG_API_KEY" \
  -u "staging:Jer29:11esv"
```

### Test All Endpoints

```bash
# Daily Plans
curl -X GET "https://staging.nextbestmove.app/api/cron/daily-plans?secret=YOUR_STAGING_SECRET" \
  -u "staging:Jer29:11esv"

# Weekly Summaries
curl -X GET "https://staging.nextbestmove.app/api/cron/weekly-summaries?secret=YOUR_STAGING_SECRET" \
  -u "staging:Jer29:11esv"

# Streak Recovery
curl -X GET "https://staging.nextbestmove.app/api/cron/streak-recovery?secret=YOUR_STAGING_SECRET" \
  -u "staging:Jer29:11esv"

# Payment Failure Recovery
curl -X GET "https://staging.nextbestmove.app/api/cron/payment-failure-recovery?secret=YOUR_STAGING_SECRET" \
  -u "staging:Jer29:11esv"

# Win-Back Campaign
curl -X GET "https://staging.nextbestmove.app/api/cron/win-back-campaign?secret=YOUR_STAGING_SECRET" \
  -u "staging:Jer29:11esv"

# Trial Reminders
curl -X GET "https://staging.nextbestmove.app/api/cron/trial-reminders?secret=YOUR_STAGING_SECRET" \
  -u "staging:Jer29:11esv"

# Auto-Unsnooze
curl -X GET "https://staging.nextbestmove.app/api/cron/auto-unsnooze?secret=YOUR_STAGING_SECRET" \
  -u "staging:Jer29:11esv"

# Auto-Archive
curl -X GET "https://staging.nextbestmove.app/api/cron/auto-archive?secret=YOUR_STAGING_SECRET" \
  -u "staging:Jer29:11esv"

# Performance Timeline
curl -X GET "https://staging.nextbestmove.app/api/cron/aggregate-performance-timeline?secret=YOUR_STAGING_SECRET" \
  -u "staging:Jer29:11esv"

# Morning Plan Email
curl -X GET "https://staging.nextbestmove.app/api/notifications/morning-plan?secret=YOUR_STAGING_SECRET" \
  -u "staging:Jer29:11esv"

# Fast Win Reminder
curl -X GET "https://staging.nextbestmove.app/api/notifications/fast-win-reminder?secret=YOUR_STAGING_SECRET" \
  -u "staging:Jer29:11esv"

# Follow-Up Alerts
curl -X GET "https://staging.nextbestmove.app/api/notifications/follow-up-alerts?secret=YOUR_STAGING_SECRET" \
  -u "staging:Jer29:11esv"
```

---

## Step 6: Verify Jobs Process Staging Data Only

After testing, verify:

1. **Check logs:**

   - Vercel function logs should show staging database queries
   - No production data should be affected

2. **Check database:**

   - Verify staging Supabase project has new data
   - Production database should be unchanged

3. **Check emails:**
   - Test emails should come from `noreply@staging.nextbestmove.app`
   - Subjects should have `[STAGING]` prefix

---

## Security Notes

- **Staging `CRON_SECRET` must be different from production**
- **Staging URLs must use `staging.nextbestmove.app`**
- **Jobs should be clearly labeled `[STAGING]` in cron-job.org**
- **Never use production `CRON_SECRET` for staging**

---

## Quick Checklist

- [ ] Generated staging `CRON_SECRET` (different from production)
- [ ] Added `CRON_SECRET` to Vercel (Preview scope)
- [ ] Verified `CRON_JOB_ORG_API_KEY` in Vercel (Preview scope)
- [ ] Created all 12 staging cron jobs in cron-job.org
- [ ] All jobs use staging URLs (`staging.nextbestmove.app`)
- [ ] All jobs use staging `CRON_SECRET` in query param
- [ ] Tested each endpoint manually
- [ ] Verified jobs process staging data only
- [ ] Verified no production data affected

---

## Troubleshooting

### Issue: 308 Permanent Redirect Error

**Symptom:** Cron job fails with "308 Permanent Redirect" in cron-job.org

**Common Causes:**

1. **Double slash in URL** (most common):

   - ❌ Wrong: `https://nextbestmove.app//api/cron/streak-recovery?secret=...` (double `//`)
   - ✅ Correct: `https://nextbestmove.app/api/cron/streak-recovery?secret=...` (single `/`)

2. **Using HTTP instead of HTTPS:**
   - ❌ Wrong: `http://staging.nextbestmove.app/api/cron/streak-recovery?secret=...`
   - ✅ Correct: `https://staging.nextbestmove.app/api/cron/streak-recovery?secret=...`

**Solution:**

1. Go to cron-job.org → Edit the failing job
2. Check the URL carefully:
   - Ensure it starts with `https://` (not `http://`)
   - Ensure there's only ONE slash after the domain: `/api` (not `//api`)
3. Save and test with "Run now"
4. Verify it succeeds

**Example Fix:**

```
❌ https://nextbestmove.app//api/cron/streak-recovery?secret=... (double slash)
✅ https://nextbestmove.app/api/cron/streak-recovery?secret=... (single slash)
```

See also: `docs/Troubleshooting/Cron_Job_308_Redirect_Fix.md`

---

### Issue: 401 Unauthorized

**Cause:** Wrong `CRON_SECRET` or missing authorization.

**Solution:**

- Verify `CRON_SECRET` in Vercel matches the secret in cron-job.org URL
- Check Authorization header if using `CRON_JOB_ORG_API_KEY`
- Verify Basic Auth credentials if testing manually

### Issue: Jobs processing production data

**Cause:** Wrong `NEXT_PUBLIC_SUPABASE_URL` or service role key.

**Solution:**

- Verify staging environment variables in Vercel (Preview scope)
- Check that `NEXT_PUBLIC_SUPABASE_URL` points to staging project
- Verify `SUPABASE_SERVICE_ROLE_KEY` is staging key (Preview scope)

### Issue: Jobs not running

**Cause:** Cron job not configured correctly in cron-job.org.

**Solution:**

- Check cron-job.org job status
- Verify URL is correct (HTTPS, not HTTP)
- Check job schedule is correct
- Verify job is enabled

---

**After completing these steps, all cron jobs will be configured for staging!** ✅
