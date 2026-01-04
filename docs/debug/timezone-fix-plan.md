# Timezone Date Calculation Fix Plan

## Problem Analysis

**Current Issue:**
- User timezone in DB: `America/New_York` ✅ (Correct)
- PostgreSQL calculates: `2026-01-03` (Saturday) in both UTC and timezone
- User sees on UI: "Friday, January 2, 2026" 
- Result: Weekend check fails because DB thinks it's Saturday but user sees Friday

**Root Cause:**
PostgreSQL's `NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York'` is calculating the date based on the server's current time, which may be in UTC. When it's late Friday night in Eastern Time (e.g., 11 PM ET = 4 AM UTC next day), PostgreSQL sees Saturday in UTC and converts it, but the conversion might not account for the fact that it's still Friday in the user's timezone.

The issue is that `NOW()` returns the server's current timestamp, and the timezone conversion happens at the database level, which may not match what JavaScript's `date-fns-tz` calculates on the client/server.

## Solution Strategy

**Option 1: Use JavaScript date-fns-tz for ALL date calculations (RECOMMENDED)**
- Remove PostgreSQL timezone calculations from SQL queries
- Use `date-fns-tz` in Node.js/TypeScript for all date operations
- Pass calculated dates to PostgreSQL as simple DATE strings
- This ensures consistency between client and server

**Option 2: Set PostgreSQL session timezone**
- Set `SET TIME ZONE 'America/New_York'` at the start of each query
- Use `CURRENT_DATE` which respects session timezone
- More complex and requires connection-level changes

**Option 3: Use PostgreSQL's timezone() function correctly**
- Use `timezone('America/New_York', NOW())::DATE` instead of `AT TIME ZONE`
- This is the correct PostgreSQL syntax for timezone conversion

## Recommended Fix: Option 1 (Use JavaScript for ALL date calculations)

**Primary Solution:** Use JavaScript `date-fns-tz` for ALL date calculations, including:
1. Calculating "today's date" in user's timezone
2. Checking if a date is a weekend
3. Getting day of week for a specific date

**Why:** PostgreSQL's timezone functions can be inconsistent, especially with `AT TIME ZONE` pattern. JavaScript's `date-fns-tz` is more reliable and consistent with what the client sees.

**Implementation:**
- ✅ Already using `getTodayInTimezone()` from `dateUtils.ts` (uses `date-fns-tz`)
- ✅ Updated `generate-daily-plan.ts` to use `isDateWeekend()` from `dateUtils.ts`
- ✅ Added `getDayOfWeekForDate()` and `isDateWeekend()` functions to `dateUtils.ts`
- ✅ Updated SQL debug queries to use `timezone()` function (for reference only)

## Implementation Steps

### Step 1: Fix `getTodayInTimezone` to use correct calculation
- Verify `date-fns-tz` is calculating correctly
- Add logging to see what date it calculates vs what PostgreSQL calculates

### Step 2: Update SQL queries to use `timezone()` function
- Replace `NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York'` 
- With: `timezone('America/New_York', NOW())::DATE`
- This is the correct PostgreSQL syntax

### Step 3: Update `generate-daily-plan.ts` weekend check
- Currently uses JavaScript `Intl.DateTimeFormat` which should be correct
- But verify it's using the same date string that was calculated

### Step 4: Add debugging/logging
- Log the date calculated by JavaScript
- Log the date calculated by PostgreSQL
- Compare them to find the mismatch

## PostgreSQL `timezone()` Function Syntax

```sql
-- Correct way to get current date in a specific timezone
SELECT timezone('America/New_York', NOW())::DATE;

-- Get day of week
SELECT EXTRACT(DOW FROM timezone('America/New_York', NOW())::DATE);

-- This is different from AT TIME ZONE which has different semantics
```

## Testing Plan

1. Run Query 4 with updated SQL using `timezone()` function
2. Compare results with JavaScript `date-fns-tz` calculation
3. Verify they match
4. Test weekend check with both Friday evening and Saturday morning
5. Test across different timezones

