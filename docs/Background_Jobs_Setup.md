# Background Jobs Setup

This document describes the background jobs (cron jobs) configured for NextBestMove.

## Overview

We use **cron-job.org** (a free external cron service) to call our API endpoints on a schedule. This approach works well for free Vercel plans that have limited built-in cron job support.

**Alternative**: If you upgrade to a Vercel Pro plan, you can use Vercel Cron instead (see "Vercel Cron (Alternative)" section below).

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

**Important**: Set `CRON_SECRET` in Vercel environment variables. External cron services (like cron-job.org) will send this header when calling your endpoints.

## Setup with cron-job.org

### 1. Generate CRON_SECRET

Generate a secure random secret:

```bash
openssl rand -hex 32
```

### 2. Add CRON_SECRET to Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `CRON_SECRET` with the generated secret
3. Add it to **Production**, **Preview**, and **Development** environments

### 3. Set Up Cron Jobs on cron-job.org

1. Go to [https://cron-job.org](https://cron-job.org) and create a free account
2. For each job, click "Create cronjob" and configure:

#### Job 1: Daily Plan Generation
- **Title**: `NextBestMove - Daily Plans`
- **Address**: `https://nextbestmove.app/api/cron/daily-plans`
- **Schedule**: `0 6 * * *` (Daily at 6 AM UTC)
- **Request method**: `GET`
- **Request headers**: 
  - Key: `Authorization`
  - Value: `Bearer YOUR_CRON_SECRET` (use the secret from step 1)

#### Job 2: Weekly Summary Generation
- **Title**: `NextBestMove - Weekly Summaries`
- **Address**: `https://nextbestmove.app/api/cron/weekly-summaries`
- **Schedule**: `0 1 * * 1` (Monday at 1 AM UTC)
- **Request method**: `GET`
- **Request headers**: 
  - Key: `Authorization`
  - Value: `Bearer YOUR_CRON_SECRET`

#### Job 3: Auto-Unsnooze
- **Title**: `NextBestMove - Auto-Unsnooze`
- **Address**: `https://nextbestmove.app/api/cron/auto-unsnooze`
- **Schedule**: `0 0 * * *` (Daily at midnight UTC)
- **Request method**: `GET`
- **Request headers**: 
  - Key: `Authorization`
  - Value: `Bearer YOUR_CRON_SECRET`

#### Job 4: Auto-Archive
- **Title**: `NextBestMove - Auto-Archive`
- **Address**: `https://nextbestmove.app/api/cron/auto-archive`
- **Schedule**: `0 2 * * *` (Daily at 2 AM UTC)
- **Request method**: `GET`
- **Request headers**: 
  - Key: `Authorization`
  - Value: `Bearer YOUR_CRON_SECRET`

### 4. Test Cron Jobs Locally

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
- **cron-job.org Dashboard**: View execution history, success/failure status, and response times
- **Vercel Dashboard**: Project → Functions → View logs (to see API endpoint logs)

Each cron endpoint returns JSON with:
- `success`: boolean
- `generated`: number of items processed
- `skipped`: number of items skipped (already exists, etc.)
- `errors`: number of errors
- `errorDetails`: array of error details (if any)

## Troubleshooting

### Cron jobs not running
1. Check cron-job.org dashboard to see if jobs are enabled and running
2. Verify the URL is correct (should be `https://nextbestmove.app/api/cron/...`)
3. Check that the Authorization header is set correctly in cron-job.org
4. Check Vercel logs for API endpoint errors

### "Unauthorized" errors
1. Verify `CRON_SECRET` is set in Vercel environment variables
2. Check that the secret in cron-job.org matches the one in Vercel
3. Ensure the Authorization header format is: `Bearer YOUR_SECRET` (with space after "Bearer")
4. For local testing, ensure `CRON_SECRET` is in `.env.local`

### Jobs running but not generating plans/summaries
1. Check cron-job.org execution logs for response details
2. Check Vercel logs for specific error messages
3. Verify users exist in database
4. Check that users have candidate actions (for daily plans)
5. Verify date calculations (weekend exclusion, week start dates)

## Vercel Cron (Alternative)

If you upgrade to Vercel Pro plan (which allows more cron jobs), you can use Vercel Cron instead:

1. Create `web/vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-plans",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/weekly-summaries",
      "schedule": "0 1 * * 1"
    },
    {
      "path": "/api/cron/auto-unsnooze",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/auto-archive",
      "schedule": "0 2 * * *"
    }
  ]
}
```

2. Vercel will automatically call your endpoints with the `Authorization: Bearer CRON_SECRET` header
3. Monitor in Vercel Dashboard → Settings → Cron Jobs

---

_Last updated: January 29, 2025_

