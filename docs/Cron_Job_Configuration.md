# Cron Job Configuration Guide

## Overview

NextBestMove uses cron-job.org to schedule background tasks. All cron endpoints support authentication via query parameter (for cron-job.org) or Authorization header (for Vercel Cron).

## Authentication

All cron endpoints accept authentication in three ways:

1. **Query Parameter** (for cron-job.org with secret):

   ```
   https://nextbestmove.app/api/cron/daily-plans?secret=YOUR_CRON_SECRET
   ```

2. **Authorization Header with CRON_SECRET** (for Vercel Cron):

   ```
   Authorization: Bearer YOUR_CRON_SECRET
   ```

3. **Authorization Header with API Key** (for cron-job.org):
   ```
   Authorization: Bearer YOUR_CRON_JOB_ORG_API_KEY
   ```

## Environment Variables

Set these in Vercel environment variables:

**CRON_SECRET** (for query param or Vercel Cron):

```
CRON_SECRET=99ad993f6bcf96c3523502f028184b248b30d125a0f2964c012afa338334b0da
```

**CRON_JOB_ORG_API_KEY** (for cron-job.org Authorization header):

```
CRON_JOB_ORG_API_KEY=tA4auCiGFs4DIVKM01ho5xJhKHyzR2XLgB8SEzaitOk=
```

**Note:** cron-job.org automatically sends the API key in the Authorization header when configured. You can also use the query parameter method if preferred.

## Cron Jobs Configuration

### 1. Daily Plans Generation

**Endpoint:** `GET /api/cron/daily-plans?secret=YOUR_CRON_SECRET`  
**Schedule:** Daily at 1:00 AM UTC  
**Purpose:** Generates daily plans for all active users

### 2. Auto-Archive

**Endpoint:** `GET /api/cron/auto-archive?secret=YOUR_CRON_SECRET`  
**Schedule:** Daily at 9:00 PM UTC  
**Purpose:** Archives DONE actions older than 90 days

### 3. Auto-Unsnooze

**Endpoint:** `GET /api/cron/auto-unsnooze?secret=YOUR_CRON_SECRET`  
**Schedule:** Daily at 2:00 AM UTC  
**Purpose:** Automatically unsnoozes actions and pins when their snooze date arrives

### 4. Weekly Summaries

**Endpoint:** `GET /api/cron/weekly-summaries?secret=YOUR_CRON_SECRET`  
**Schedule:** Monday at 1:00 AM UTC (Sunday night / Monday morning)  
**Purpose:** Generates weekly summaries for the previous week

### 5. Trial Reminders

**Endpoint:** `GET /api/cron/trial-reminders?secret=YOUR_CRON_SECRET`  
**Schedule:** Daily at 8:00 AM UTC  
**Purpose:** Sends trial reminder emails (Day 12 and Day 14)

### 6. Morning Plan Emails

**Endpoint:** `GET /api/notifications/morning-plan?secret=YOUR_CRON_SECRET`  
**Schedule:** Hourly (to catch users at 8am in their timezone)  
**Purpose:** Sends morning plan emails to users who have it enabled

### 7. Follow-Up Alerts

**Endpoint:** `GET /api/notifications/follow-up-alerts?secret=YOUR_CRON_SECRET`  
**Schedule:** Daily at 10:00 AM UTC  
**Purpose:** Sends alerts for overdue follow-up actions

### 8. Fast Win Reminders

**Endpoint:** `GET /api/notifications/fast-win-reminder?secret=YOUR_CRON_SECRET`  
**Schedule:** Hourly (to catch users at 2pm in their timezone)  
**Purpose:** Sends fast win reminder emails at 2pm

## Setting Up in cron-job.org

1. **Create a new cron job** for each endpoint above
2. **URL Format (Option 1 - Query Parameter):**
   ```
   https://nextbestmove.app/api/cron/[endpoint]?secret=99ad993f6bcf96c3523502f028184b248b30d125a0f2964c012afa338334b0da
   ```
3. **URL Format (Option 2 - API Key in Header):**
   ```
   https://nextbestmove.app/api/cron/[endpoint]
   ```
   - cron-job.org will automatically send: `Authorization: Bearer tA4auCiGFs4DIVKM01ho5xJhKHyzR2XLgB8SEzaitOk=`
4. **Method:** GET
5. **Schedule:** As specified above for each job

## Example cron-job.org Configuration

**Title:** NextBestMove - Daily Plans  
**URL:** `https://nextbestmove.app/api/cron/daily-plans?secret=99ad993f6bcf96c3523502f028184b248b30d125a0f2964c012afa338334b0da`  
**Schedule:** Daily at 1:00 AM UTC  
**Request Method:** GET

## Troubleshooting

### All jobs showing "Failed (HTTP error)"

**Possible causes:**

1. **Incorrect secret/API key:**
   - If using query parameter: Verify the `CRON_SECRET` in Vercel matches the one in cron-job.org URLs
   - If using API key: Verify `CRON_JOB_ORG_API_KEY` is set in Vercel and matches your cron-job.org API key
2. **Missing query parameter:** If using query param method, ensure `?secret=...` is included in the URL
3. **Environment variable not set:** Check that both `CRON_SECRET` and `CRON_JOB_ORG_API_KEY` are set in Vercel environment variables
4. **Code not deployed:** Ensure the latest code with API key support has been deployed to Vercel

### Testing Endpoints

You can test endpoints manually using curl:

```bash
curl "https://nextbestmove.app/api/cron/daily-plans?secret=YOUR_CRON_SECRET"
```

Or with Authorization header:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://nextbestmove.app/api/cron/daily-plans
```

## Future: Vercel Cron

When upgrading to Vercel Pro, you can switch to Vercel Cron which automatically sends the Authorization header. No code changes needed - the endpoints already support both methods.
