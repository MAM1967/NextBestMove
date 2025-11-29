# Background Jobs Setup

This document describes the background jobs (cron jobs) configured for NextBestMove.

## Overview

We use **Vercel Cron** to run scheduled background jobs. All cron endpoints are configured in `vercel.json` and run automatically on the specified schedule.

## Cron Jobs

### 1. Daily Plan Generation
- **Endpoint**: `/api/cron/daily-plans`
- **Schedule**: Daily at 6 AM UTC (`0 6 * * *`)
- **Purpose**: Generate daily plans for all active users
- **Logic**: 
  - Fetches all users
  - Skips weekends if user has `exclude_weekends` enabled
  - Skips if plan already exists for today
  - Uses shared `generateDailyPlanForUser()` function

### 2. Weekly Summary Generation
- **Endpoint**: `/api/cron/weekly-summaries`
- **Schedule**: Monday at 1 AM UTC (`0 1 * * 1`)
- **Purpose**: Generate weekly summaries for the previous week (Monday-Sunday)
- **Logic**:
  - Calculates previous week's Monday
  - Fetches all users
  - Skips if summary already exists for that week
  - Uses shared `generateWeeklySummaryForUser()` function

### 3. Auto-Unsnooze
- **Endpoint**: `/api/cron/auto-unsnooze`
- **Schedule**: Daily at midnight UTC (`0 0 * * *`)
- **Purpose**: Automatically unsnooze pins and actions that have reached their `snooze_until` date
- **Logic**:
  - Updates `person_pins` with `status='SNOOZED'` and `snooze_until <= today` to `status='ACTIVE'`
  - Updates `actions` with `state='SNOOZED'` and `snooze_until <= today` to `state='NEW'`
- **Note**: There's also a database trigger that handles this on INSERT/UPDATE, but this cron ensures it runs even if no items are touched

### 4. Auto-Archive
- **Endpoint**: `/api/cron/auto-archive`
- **Schedule**: Daily at 2 AM UTC (`0 2 * * *`)
- **Purpose**: Archive DONE actions older than 90 days
- **Logic**:
  - Finds all actions with `state='DONE'` and `completed_at < 90 days ago`
  - Updates them to `state='ARCHIVED'`
- **Reference**: PRD Section 18 - "Actions in DONE state: Kept 'live' for 90 days, then marked ARCHIVED."

## Security

All cron endpoints verify the `CRON_SECRET` environment variable:

```typescript
const authHeader = request.headers.get("authorization");
const cronSecret = process.env.CRON_SECRET;

if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Important**: Set `CRON_SECRET` in Vercel environment variables. Vercel Cron automatically sends this header when calling your endpoints.

## Vercel Configuration

### 1. Add CRON_SECRET to Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `CRON_SECRET` with a secure random string (e.g., generate with `openssl rand -hex 32`)
3. Add it to **Production**, **Preview**, and **Development** environments

### 2. Verify Cron Jobs in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Cron Jobs
2. Verify that all 4 cron jobs are listed:
   - `daily-plans` - `0 6 * * *`
   - `weekly-summaries` - `0 1 * * 1`
   - `auto-unsnooze` - `0 0 * * *`
   - `auto-archive` - `0 2 * * *`

### 3. Test Cron Jobs Locally

For local testing, you can manually call the endpoints:

```bash
# Set CRON_SECRET in .env.local
CRON_SECRET=your-secret-here

# Test daily plans cron
curl -X GET http://localhost:3000/api/cron/daily-plans \
  -H "Authorization: Bearer your-secret-here"

# Test weekly summaries cron
curl -X GET http://localhost:3000/api/cron/weekly-summaries \
  -H "Authorization: Bearer your-secret-here"

# Test auto-unsnooze
curl -X GET http://localhost:3000/api/cron/auto-unsnooze \
  -H "Authorization: Bearer your-secret-here"

# Test auto-archive
curl -X GET http://localhost:3000/api/cron/auto-archive \
  -H "Authorization: Bearer your-secret-here"
```

## Shared Functions

To avoid code duplication, we've extracted the generation logic into shared functions:

- **`/lib/plans/generate-daily-plan.ts`**: `generateDailyPlanForUser()`
- **`/lib/summaries/generate-weekly-summary.ts`**: `generateWeeklySummaryForUser()`

These functions can be called from both:
- Authenticated user endpoints (`/api/daily-plans/generate`, `/api/weekly-summaries/generate`)
- Cron jobs (`/api/cron/daily-plans`, `/api/cron/weekly-summaries`)

## Monitoring

Monitor cron job execution in:
- **Vercel Dashboard**: Project → Functions → View logs
- **Vercel Cron Dashboard**: Project → Settings → Cron Jobs → View execution history

Each cron endpoint returns JSON with:
- `success`: boolean
- `generated`: number of items processed
- `skipped`: number of items skipped (already exists, etc.)
- `errors`: number of errors
- `errorDetails`: array of error details (if any)

## Troubleshooting

### Cron jobs not running
1. Check that `vercel.json` is in the `web/` directory (not root)
2. Verify cron jobs appear in Vercel Dashboard → Settings → Cron Jobs
3. Check Vercel logs for errors

### "Unauthorized" errors
1. Verify `CRON_SECRET` is set in Vercel environment variables
2. Check that the secret matches what Vercel is sending
3. For local testing, ensure `CRON_SECRET` is in `.env.local`

### Jobs running but not generating plans/summaries
1. Check logs for specific error messages
2. Verify users exist in database
3. Check that users have candidate actions (for daily plans)
4. Verify date calculations (weekend exclusion, week start dates)

---

_Last updated: January 29, 2025_

