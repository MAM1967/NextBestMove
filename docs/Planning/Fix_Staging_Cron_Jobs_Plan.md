# Plan: Fix Failing Staging Cron Jobs

## Problem
5 staging cron jobs are failing with "Invalid API key" errors:
1. [STAGING] Daily Plans
2. [STAGING] Payment Failure Recovery
3. [STAGING] Streak Recovery
4. [STAGING] Win-Back Campaign
5. [STAGING] Morning Plan Email

**Root Cause:** Jobs created via API use query parameters (`?secret=...`) instead of Authorization headers. Successful jobs use `Authorization: Bearer {CRON_SECRET}` headers.

## Solution
Update the 5 failing jobs via cron-job.org API to:
1. Remove `?secret=...` query parameter from URL
2. Add `Authorization: Bearer {CRON_SECRET}` header via `extendedData.headers`
3. Keep all other job settings (schedule, enabled status) unchanged

## Implementation

### Step 1: Create Update Script
**File:** `scripts/fix-staging-cron-jobs.sh`

**Functionality:**
- Fetches all jobs from cron-job.org API
- Finds job IDs for the 5 failing jobs by title
- Updates each job using PATCH `/jobs/{jobId}` endpoint
- Adds `extendedData.headers.Authorization` with Bearer token
- Removes query parameter from URL

**Usage:**
```bash
./scripts/fix-staging-cron-jobs.sh e6720e0c094fd8ba7494b27073d03c6405d9422bdc1e0af0a7e16f678f55ec83
```

### Step 2: Execute Script
Run the script to update all 5 jobs programmatically.

### Step 3: Verify Updates
1. Go to cron-job.org dashboard
2. Verify each job's URL no longer has `?secret=...`
3. Verify each job has Authorization header configured
4. Test each job using "Run now" button
5. Confirm all jobs succeed without "Invalid API key" errors

## Technical Details

### API Endpoint
- **Method:** PATCH
- **URL:** `https://api.cron-job.org/jobs/{jobId}`
- **Headers:**
  - `Authorization: Bearer {CRON_JOB_ORG_API_KEY}`
  - `Content-Type: application/json`

### Update Payload
```json
{
  "job": {
    "url": "https://staging.nextbestmove.app/api/cron/{endpoint}",
    "extendedData": {
      "headers": {
        "Authorization": "Bearer e6720e0c094fd8ba7494b27073d03c6405d9422bdc1e0af0a7e16f678f55ec83"
      }
    }
  }
}
```

### Jobs to Update
| Title | Endpoint | Current Issue |
|-------|----------|---------------|
| [STAGING] Daily Plans | `/api/cron/daily-plans` | Uses `?secret=...` query param |
| [STAGING] Payment Failure Recovery | `/api/cron/payment-failure-recovery` | Uses `?secret=...` query param |
| [STAGING] Streak Recovery | `/api/cron/streak-recovery` | Uses `?secret=...` query param |
| [STAGING] Win-Back Campaign | `/api/cron/win-back-campaign` | Uses `?secret=...` query param |
| [STAGING] Morning Plan Email | `/api/notifications/morning-plan` | Uses `?secret=...` query param |

## Verification Checklist
- [ ] Script created and executable
- [ ] All 5 jobs updated successfully
- [ ] URLs no longer contain `?secret=...`
- [ ] Authorization headers configured
- [ ] All jobs tested and succeed
- [ ] No "Invalid API key" errors

## Notes
- The script uses `jq` if available, otherwise falls back to Python JSON parsing or basic grep
- Rate limiting: 2-second delay between updates
- The CRON_SECRET value is: `e6720e0c094fd8ba7494b27073d03c6405d9422bdc1e0af0a7e16f678f55ec83`
- Vercel environment variables are confirmed correct (SUPABASE_SERVICE_ROLE_KEY is set in Preview scope)










