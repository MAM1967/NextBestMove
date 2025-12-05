# Fix: Cron Job 308 Permanent Redirect Error

## Problem

Cron jobs are failing with:
```
Failed (HTTP error) 308 Permanent Redirect
```

## Root Causes

The 308 redirect error can be caused by:

1. **Double slash in URL** (most common):
   - URL has `//api` instead of `/api` (e.g., `https://nextbestmove.app//api/cron/...`)
   - Vercel redirects this to the correct path, but cron-job.org doesn't follow redirects

2. **Using HTTP instead of HTTPS:**
   - URL uses `http://` instead of `https://`
   - Vercel automatically redirects HTTP to HTTPS with a 308 status code, but cron-job.org doesn't follow redirects

## Solution

Update all cron job URLs in cron-job.org to:
- Use **HTTPS** (not HTTP)
- Have only **one slash** after the domain (not double slash)

### Correct URL Format

**For query parameter authentication:**
```
https://nextbestmove.app/api/cron/streak-recovery?secret=YOUR_CRON_SECRET
```

**For Authorization header authentication:**
```
https://nextbestmove.app/api/cron/streak-recovery
```
With header: `Authorization: Bearer YOUR_CRON_SECRET` or `Authorization: Bearer YOUR_CRON_JOB_ORG_API_KEY`

### Steps to Fix

1. **Log in to cron-job.org**
2. **Find the "Streak Recovery" cron job**
3. **Edit the job**
4. **Update the URL:**
   - ❌ **Wrong (HTTP):** `http://nextbestmove.app/api/cron/streak-recovery?secret=...`
   - ❌ **Wrong (double slash):** `https://nextbestmove.app//api/cron/streak-recovery?secret=...`
   - ✅ **Correct:** `https://nextbestmove.app/api/cron/streak-recovery?secret=...`
5. **Save the changes**
6. **Test the job manually** (use "Run now" button)
7. **Verify it succeeds**

### All Cron Jobs to Check

Update these URLs to use HTTPS:

1. **Daily Plans Generation:**
   - `https://nextbestmove.app/api/cron/daily-plans?secret=...`

2. **Weekly Summaries:**
   - `https://nextbestmove.app/api/cron/weekly-summaries?secret=...`

3. **Payment Failure Recovery:**
   - `https://nextbestmove.app/api/cron/payment-failure-recovery?secret=...`

4. **Streak Recovery:**
   - `https://nextbestmove.app/api/cron/streak-recovery?secret=...`

5. **Win-Back Campaign:**
   - `https://nextbestmove.app/api/cron/win-back-campaign?secret=...`

6. **Trial Reminders:**
   - `https://nextbestmove.app/api/cron/trial-reminders?secret=...`

7. **Performance Timeline Aggregation:**
   - `https://nextbestmove.app/api/cron/aggregate-performance-timeline?secret=...`

8. **Notification Emails (if separate):**
   - `https://nextbestmove.app/api/cron/morning-plan?secret=...`
   - `https://nextbestmove.app/api/cron/fast-win-reminder?secret=...`
   - `https://nextbestmove.app/api/cron/follow-up-alerts?secret=...`

### Verification

After updating, verify each cron job:

1. **Manual Test:**
   - Click "Run now" in cron-job.org
   - Should see "Success" status
   - Check execution history for successful runs

2. **Check Logs:**
   - Verify endpoint receives request
   - Check application logs for successful execution
   - Verify no 308 errors in cron-job.org history

### Prevention

**Best Practice:** Always use HTTPS for production cron jobs:
- ✅ `https://` for all production URLs
- ❌ Never use `http://` for production

**Note:** For local development, `http://localhost:3000` is fine, but production must use HTTPS.

---

## Quick Checklist

- [ ] Updated Streak Recovery URL to HTTPS
- [ ] Updated all other cron job URLs to HTTPS
- [ ] Tested each cron job manually
- [ ] Verified execution history shows success
- [ ] No more 308 errors in cron-job.org

---

**Last Updated:** December 2024

