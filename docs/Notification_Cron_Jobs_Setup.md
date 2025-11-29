# Notification Email Cron Jobs Setup

This guide covers setting up the notification email cron jobs in cron-job.org.

## Overview

We have 4 notification email endpoints that need to be set up as cron jobs:

1. **Morning Plan Email** - Sends daily at 8am in each user's timezone
2. **Fast Win Reminder** - Sends at 2pm if fast win not completed
3. **Follow-Up Alerts** - Sends daily for overdue follow-ups
4. **Weekly Summary Email** - Already handled by existing weekly summary cron job

## Authentication

**Important**: Notification endpoints use **query parameters** for authentication, not Authorization headers.

Format: `?secret=YOUR_CRON_SECRET`

## Setup Steps

### 1. Get Your CRON_SECRET

If you haven't already, generate a secure secret:

```bash
openssl rand -hex 32
```

Make sure this is set in Vercel environment variables as `CRON_SECRET`.

### 2. Set Up Jobs in cron-job.org

Go to [https://cron-job.org](https://cron-job.org) and sign in.

#### Job 1: Morning Plan Email

- **Title**: `NextBestMove - Morning Plan Emails`
- **Address**: `https://nextbestmove.app/api/notifications/morning-plan?secret=YOUR_CRON_SECRET`
  - Replace `YOUR_CRON_SECRET` with your actual secret
- **Schedule**: `0 * * * *` (Every hour at minute 0)
- **Request method**: `POST`
- **Request headers**: None needed (uses query parameter)
- **Why hourly?**: Runs every hour to catch 8am in all timezones

#### Job 2: Fast Win Reminder

- **Title**: `NextBestMove - Fast Win Reminders`
- **Address**: `https://nextbestmove.app/api/notifications/fast-win-reminder?secret=YOUR_CRON_SECRET`
  - Replace `YOUR_CRON_SECRET` with your actual secret
- **Schedule**: `0 * * * *` (Every hour at minute 0)
- **Request method**: `POST`
- **Request headers**: None needed (uses query parameter)
- **Why hourly?**: Runs every hour to catch 2pm in all timezones

#### Job 3: Follow-Up Alerts

- **Title**: `NextBestMove - Follow-Up Alerts`
- **Address**: `https://nextbestmove.app/api/notifications/follow-up-alerts?secret=YOUR_CRON_SECRET`
  - Replace `YOUR_CRON_SECRET` with your actual secret
- **Schedule**: `0 9 * * *` (Daily at 9 AM UTC)
- **Request method**: `POST`
- **Request headers**: None needed (uses query parameter)

#### Job 4: Weekly Summary Email

- **Already configured** as part of the weekly summary generation job
- The `/api/cron/weekly-summaries` endpoint now automatically sends emails after generating summaries
- No additional setup needed

## Testing Locally

1. **Navigate to the web directory:**

   ```bash
   cd web
   ```

2. **Add CRON_SECRET to `.env.local`** (if not already there):

   ```bash
   # In web/.env.local
   CRON_SECRET=your-secret-here
   RESEND_API_KEY=your-resend-api-key
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

4. **In a new terminal (still in `web/` directory), test the endpoints:**

   ```bash
   # Test morning plan notifications
   curl -X POST "http://localhost:3000/api/notifications/morning-plan?secret=your-secret-here"

   # Test fast win reminder notifications
   curl -X POST "http://localhost:3000/api/notifications/fast-win-reminder?secret=your-secret-here"

   # Test follow-up alerts notifications
   curl -X POST "http://localhost:3000/api/notifications/follow-up-alerts?secret=your-secret-here"
   ```

**Note**: Replace `your-secret-here` with the actual `CRON_SECRET` value.

## Expected Responses

All endpoints return JSON with:

```json
{
  "success": true,
  "sent": 2,
  "skipped": 5,
  "errors": ["User email@example.com: Error message"] // optional
}
```

## User Preferences

All notification endpoints respect user preferences:

- `email_morning_plan` - Must be `true`
- `email_fast_win_reminder` - Must be `true`
- `email_follow_up_alerts` - Must be `true`
- `email_weekly_summary` - Must be `true`
- `email_unsubscribed` - Must be `false` (global unsubscribe overrides all)

## Timezone Handling

- **Morning Plan** and **Fast Win Reminder** run hourly and check each user's timezone
- Only sends emails when it's the correct time in the user's timezone (8am for morning plan, 2pm for fast win)
- This ensures users get emails at the right time regardless of their location

## Monitoring

Monitor cron job execution in:

- **cron-job.org Dashboard**: View execution history, success/failure status, and response times
- **Vercel Dashboard**: Project → Functions → View logs (to see API endpoint logs)
- **Resend Dashboard**: View email delivery status and bounces

## Troubleshooting

### "Unauthorized" errors

1. Verify `CRON_SECRET` is set in Vercel environment variables
2. Check that the secret in the URL matches the one in Vercel
3. Ensure the query parameter format is correct: `?secret=YOUR_SECRET` (no spaces)

### Emails not sending

1. Check that `RESEND_API_KEY` is set in Vercel
2. Verify user has the appropriate email preference enabled
3. Check that user is not unsubscribed (`email_unsubscribed = false`)
4. Check Resend dashboard for delivery issues

### Wrong timezone emails

1. Verify user's `timezone` field is set correctly (IANA timezone format, e.g., "America/New_York")
2. Check cron-job.org execution logs to see when jobs ran
3. The hourly jobs should catch all timezones, but verify they're running every hour

### No emails for some users

1. Check user's email preferences in database
2. Verify daily plan exists for today (morning plan and fast win require a plan)
3. For fast win reminder, verify fast win exists and is not completed
4. For follow-up alerts, verify there are overdue actions

---

_Last updated: January 29, 2025_

