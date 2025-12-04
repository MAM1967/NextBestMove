# Group 4.2 Phase 3: Performance Timeline Testing Checklist

**Date:** December 2024  
**Status:** Ready for Testing  
**Feature:** Performance Timeline - Historical performance visualization

---

## Overview

This checklist tests the Performance Timeline feature, which provides Premium users with visual charts of their activity and performance metrics over time.

---

## Prerequisites

1. **Test Users:**

   - Premium user account (for feature access)
   - Standard user account (for upgrade prompt testing)
   - Premium user should have at least 7-30 days of activity history

2. **Test Data Requirements:**

   - At least 7 days of completed actions (for timeline data)
   - Actions in various states (DONE, REPLIED, SENT)
   - Some pins created/archived
   - Calendar activity (optional, for capacity context)

3. **Cron Job Setup:**
   - Verify cron job is running: `/api/cron/aggregate-performance-timeline`
   - Should run daily at 11:59 PM UTC
   - Check that data exists in `performance_timeline_data` table

---

## Test 1: Performance Timeline - Premium User Access

**Goal:** Verify Premium users can access the Performance Timeline page

### Setup

1. Log in as Premium user
2. Ensure user has at least 7 days of activity history
3. Navigate to `/app/insights/timeline`

### Test Steps

1. **View Timeline Page:**

   - Should load without errors
   - Should see "Performance Timeline" heading
   - Should see date range selector (7d, 30d, 90d, 365d)
   - Should see granularity selector (Day, Week, Month)
   - Should see summary cards at top

2. **Check Summary Cards:**

   - Total Days Tracked
   - Total Actions Completed
   - Total Replies Received
   - Avg. Completion Rate
   - Avg. Reply Rate
   - All values should be numbers (not null/undefined)

3. **Check Charts:**
   - Should see "Activity Over Time" area chart
   - Should see "Performance Rates" line chart
   - Charts should be responsive and readable
   - Tooltips should work on hover

### Expected Results

- ✅ Premium user can access timeline page
- ✅ Summary cards display correct data
- ✅ Charts render correctly
- ✅ No console errors

---

## Test 2: Performance Timeline - Standard User Upgrade Prompt

**Goal:** Verify Standard users see upgrade prompt

### Setup

1. Log in as Standard user
2. Navigate to `/app/insights/timeline`

### Test Steps

1. **Check Paywall:**

   - Should see `PaywallOverlay` component
   - Should mention "Performance Timeline" as Premium feature
   - Should have upgrade button/link

2. **Check API Response:**
   - API `/api/performance-timeline` should return 402 status
   - Error code should be "UPGRADE_REQUIRED"

### Expected Results

- ✅ Standard user sees paywall overlay
- ✅ Clear messaging about Premium feature
- ✅ Upgrade path is available

---

## Test 3: Performance Timeline - Date Range Selection

**Goal:** Verify date range presets and custom date selection work

### Setup

1. Log in as Premium user
2. Navigate to `/app/insights/timeline`
3. Ensure user has data spanning at least 30 days

### Test Steps

1. **Test Presets:**

   - Click "Last 7 Days" - data should update
   - Click "Last 30 Days" - data should update
   - Click "Last 90 Days" - data should update
   - Click "Last 365 Days" - data should update
   - URL should update with query params

2. **Test Custom Dates:**

   - Click custom date inputs
   - Select start date (e.g., 14 days ago)
   - Select end date (e.g., today)
   - Data should update to show only selected range
   - URL should reflect custom dates

3. **Test Edge Cases:**
   - Start date after end date - should default to 30 days
   - Very old start date - should handle gracefully
   - Future end date - should cap at today

### Expected Results

- ✅ All presets work correctly
- ✅ Custom date selection works
- ✅ URL params update correctly
- ✅ Edge cases handled gracefully

---

## Test 4: Performance Timeline - Granularity Selection

**Goal:** Verify day/week/month aggregation works correctly

### Setup

1. Log in as Premium user
2. Navigate to `/app/insights/timeline`
3. Select date range with at least 30 days of data

### Test Steps

1. **Test Day Granularity:**

   - Select "Day" granularity
   - Chart should show individual days
   - X-axis labels should show dates (e.g., "Dec 01")
   - Each data point represents one day

2. **Test Week Granularity:**

   - Select "Week" granularity
   - Chart should show weekly aggregates
   - X-axis labels should show "Week of MMM dd, yyyy"
   - Data should be summed/averaged per week

3. **Test Month Granularity:**

   - Select "Month" granularity
   - Chart should show monthly aggregates
   - X-axis labels should show "MMM yyyy"
   - Data should be summed/averaged per month

4. **Verify Aggregation Logic:**
   - Counts (actions_completed, replies_received) should sum
   - Rates (completion_rate, reply_rate) should average
   - Summary cards should reflect selected granularity

### Expected Results

- ✅ All granularities work correctly
- ✅ Aggregation logic is accurate
- ✅ Charts update appropriately
- ✅ Summary cards reflect aggregation

---

## Test 5: Performance Timeline - Empty Data Handling

**Goal:** Verify graceful handling when no data exists

### Setup

1. Log in as Premium user with no activity history
2. Navigate to `/app/insights/timeline`

### Test Steps

1. **Check Empty State:**

   - Should see message: "No performance data available for the selected period"
   - Should see helpful text: "Start completing actions to see your progress here!"
   - Charts should not render (or show empty state)

2. **Check Summary Cards:**
   - Should show 0 or N/A for all metrics
   - Should not crash or show errors

### Expected Results

- ✅ Empty state displays correctly
- ✅ No errors or crashes
- ✅ Helpful messaging for users

---

## Test 6: Performance Timeline - Cron Job Data Aggregation

**Goal:** Verify daily cron job correctly aggregates data

### Setup

1. Premium user with activity from yesterday
2. Wait for cron job to run (or manually trigger)

### Test Steps

1. **Check Database:**

   - Query `performance_timeline_data` table
   - Should have entry for yesterday's date
   - Metrics should be accurate:
     - `actions_completed` = count of DONE/REPLIED/SENT actions
     - `actions_created` = count of actions created
     - `replies_received` = count of actions with `replied_at`
     - `pins_created` = count of pins created
     - `pins_archived` = count of pins archived
     - `streak_day` = current streak from users table
     - `completion_rate` = actions_completed / actions_created
     - `reply_rate` = replies_received / outreach_actions

2. **Verify Cron Job:**

   - Check cron job logs (cron-job.org or Vercel logs)
   - Should run daily at 11:59 PM UTC
   - Should process all Premium users
   - Should handle errors gracefully

3. **Test Manual Trigger:**
   - Call `GET /api/cron/aggregate-performance-timeline` with cron secret
   - Should return success with processed count
   - Should update database correctly

### Expected Results

- ✅ Cron job runs successfully
- ✅ Data aggregation is accurate
- ✅ Only Premium users are processed
- ✅ Old data (>365 days) is cleaned up

---

## Test 7: Performance Timeline - Chart Interactions

**Goal:** Verify chart tooltips and interactions work

### Setup

1. Log in as Premium user
2. Navigate to `/app/insights/timeline`
3. Ensure data is loaded

### Test Steps

1. **Test Tooltips:**

   - Hover over data points in "Activity Over Time" chart
   - Tooltip should show date and values
   - Hover over data points in "Performance Rates" chart
   - Tooltip should show date and percentages

2. **Test Responsiveness:**

   - Resize browser window
   - Charts should adapt to container size
   - Should remain readable on mobile/tablet

3. **Test Chart Legends:**
   - Click legend items to toggle series visibility
   - Chart should update accordingly

### Expected Results

- ✅ Tooltips display correctly
- ✅ Charts are responsive
- ✅ Legends are interactive

---

## Test 8: Performance Timeline - Data Accuracy

**Goal:** Verify displayed metrics match actual user activity

### Setup

1. Log in as Premium user
2. Note actual activity counts (actions, replies, pins)
3. Navigate to `/app/insights/timeline`

### Test Steps

1. **Compare Summary Cards:**

   - Total Actions Completed should match actual completed actions
   - Total Replies Received should match actual replies
   - Completion Rate should be accurate (completed / created)
   - Reply Rate should be accurate (replies / outreach)

2. **Compare Chart Data:**

   - Hover over recent data points
   - Values should match database entries
   - Dates should be correct

3. **Test Edge Cases:**
   - User with 0 actions - should show 0s
   - User with 100% completion - should show 1.0 rate
   - User with no replies - should show 0.0 reply rate

### Expected Results

- ✅ All metrics are accurate
- ✅ Charts reflect actual data
- ✅ Edge cases handled correctly

---

## Quick Test Checklist

### Basic Functionality

- [ ] Premium user can access timeline page
- [ ] Standard user sees upgrade prompt
- [ ] Summary cards display correctly
- [ ] Charts render without errors

### Date Range & Granularity

- [ ] All date range presets work (7d, 30d, 90d, 365d)
- [ ] Custom date selection works
- [ ] Day granularity shows daily data
- [ ] Week granularity aggregates correctly
- [ ] Month granularity aggregates correctly

### Data & Accuracy

- [ ] Cron job aggregates data correctly
- [ ] Metrics match actual user activity
- [ ] Empty state displays correctly
- [ ] Edge cases handled gracefully

### UI/UX

- [ ] Charts are responsive
- [ ] Tooltips work correctly
- [ ] Legends are interactive
- [ ] URL params update correctly

---

## API Endpoints to Test

### Performance Timeline

```
GET /api/performance-timeline?startDate=2025-01-01&endDate=2025-01-31&granularity=day
```

**Premium user:** Returns timeline data  
**Standard user:** Returns 402 with `UPGRADE_REQUIRED`

### Cron Job

```
GET /api/cron/aggregate-performance-timeline
```

**With cron secret:** Processes all Premium users, returns success  
**Without secret:** Returns 401 Unauthorized

---

## Troubleshooting

### No data showing

- **Check:** Cron job has run at least once
- **Check:** User has Premium subscription
- **Check:** Date range includes days with activity
- **Check:** Database has entries in `performance_timeline_data`

### Charts not rendering

- **Check:** Browser console for errors
- **Check:** `recharts` library is installed
- **Check:** Data array is not empty
- **Check:** Date formatting is correct

### Inaccurate metrics

- **Check:** Cron job aggregation logic
- **Check:** Database queries in cron job
- **Check:** Date calculations (UTC vs local time)
- **Check:** Rate calculations (division by zero)

### Cron job not running

- **Check:** Cron job is configured in cron-job.org
- **Check:** `CRON_SECRET` env var is set
- **Check:** Endpoint is accessible
- **Check:** Logs for errors

---

## Test Data Setup (Optional)

If you need to create test data quickly:

```sql
-- Manually insert test timeline data for a Premium user
-- Replace USER_ID with actual Premium user ID

INSERT INTO performance_timeline_data (user_id, date, metrics)
VALUES
  (USER_ID, CURRENT_DATE - INTERVAL '7 days', '{"actions_completed": 5, "actions_created": 6, "replies_received": 2, "pins_created": 1, "pins_archived": 0, "streak_day": 7, "completion_rate": 0.83, "reply_rate": 0.40}'::jsonb),
  (USER_ID, CURRENT_DATE - INTERVAL '6 days', '{"actions_completed": 3, "actions_created": 4, "replies_received": 1, "pins_created": 0, "pins_archived": 0, "streak_day": 8, "completion_rate": 0.75, "reply_rate": 0.25}'::jsonb),
  -- Add more days as needed
ON CONFLICT (user_id, date) DO UPDATE SET metrics = EXCLUDED.metrics;
```

---

_Last updated: December 2024_
