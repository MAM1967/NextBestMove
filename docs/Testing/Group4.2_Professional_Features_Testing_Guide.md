# Group 4.2: Premium Plan Features Testing Guide

**Date:** December 2024  
**Status:** ✅ Testing Complete  
**Features:** Pattern Detection (Phase 1) ✅ + Pre-Call Briefs (Phase 2) ✅ + Performance Timeline (Phase 3) ✅ + Content Engine with Voice Learning (Phase 4) ✅

---

## Overview

This guide tests the first two Premium plan features:
- **Phase 1: Pattern Detection** - AI-powered insights about outreach patterns
- **Phase 2: Pre-Call Briefs** - Auto-generated call preparation summaries

Both features are gated behind Premium plan with upgrade prompts for Standard users.

---

## Prerequisites

1. **Test Users:**
   - Premium user account (for feature access)
   - Standard user account (for upgrade prompt testing)
   - Both users should have some activity history (actions, pins, calendar events)

2. **Test Data Requirements:**
   - At least 10-15 completed actions (for pattern detection)
   - At least 1 person pin (for pre-call briefs)
   - Calendar connected (for pre-call briefs)
   - At least 1 upcoming calendar event with "call" keyword (for pre-call briefs)

---

## Test 1: Pattern Detection - Premium User Access

**Goal:** Verify Premium users can access pattern detection and see insights

### Setup
1. Log in as Premium user
2. Ensure user has completed at least 10-15 actions over the past 90 days
3. Navigate to `/app/insights`

### Test Steps
1. **View Insights Page:**
   - Should see "Pattern Detection" section
   - Should NOT see upgrade prompt

2. **Check Pattern Display:**
   - Patterns should load (may take a few seconds)
   - Should see at least one pattern card if user has sufficient activity
   - Each pattern should show:
     - Title (e.g., "Best Days for Outreach")
     - Insight text (AI-generated or fallback)
     - Confidence score

3. **Verify Pattern Types:**
   - Check for different pattern types:
     - Day of week performance
     - Follow-up timing
     - Action type conversion
     - Warm re-engagement
   - Not all patterns may appear (depends on user's activity)

### Expected Results
- ✅ Premium user can access insights page
- ✅ Patterns load and display correctly
- ✅ Insight text is readable and relevant
- ✅ No errors in console

---

## Test 2: Pattern Detection - Standard User Upgrade Prompt

**Goal:** Verify Standard users see upgrade prompt

### Setup
1. Log in as Standard user
2. Navigate to `/app/insights`

### Test Steps
1. **View Insights Page:**
   - Should see "Pattern Detection" section
   - Should see upgrade prompt/message

2. **Check Upgrade Modal:**
   - Click on pattern detection section (if interactive)
   - Should trigger upgrade modal
   - Modal should mention "Pattern Detection" as Premium feature

### Expected Results
- ✅ Standard user sees upgrade prompt
- ✅ Upgrade modal appears when accessing feature
- ✅ Clear messaging about Premium feature

---

## Test 3: Pattern Detection - Insufficient Data

**Goal:** Verify graceful handling when user doesn't have enough activity

### Setup
1. Log in as Premium user with minimal activity (< 5 actions)
2. Navigate to `/app/insights`

### Test Steps
1. **Check Response:**
   - API should return success with empty patterns array
   - Should show message: "Not enough activity yet to detect meaningful patterns"

### Expected Results
- ✅ No errors
- ✅ Helpful message displayed
- ✅ User understands they need more activity

---

## Test 4: Pre-Call Briefs - Premium User with Calendar Event

**Goal:** Verify Premium users get pre-call briefs for upcoming calls

### Setup
1. Log in as Premium user
2. Ensure calendar is connected (Google or Outlook)
3. Create a calendar event in the next 24 hours with:
   - Title containing "call", "meeting", "zoom", or similar keyword
   - Event should match a person pin name (for best results)
4. Navigate to `/app/plan`

### Test Steps
1. **Check Daily Plan Page:**
   - Should see Pre-Call Brief card(s) if calls detected
   - Card should show:
     - Event title
     - Time
     - Person name (if matched)
     - Brief preview

2. **View Full Brief:**
   - Click "View Brief" button
   - Modal should open with full brief content
   - Brief should include:
     - Last interaction date
     - Follow-up history
     - Suggested talking points
     - User notes (if available)

### Expected Results
- ✅ Pre-call brief card appears on daily plan page
- ✅ Brief content is relevant and helpful
- ✅ Modal displays full brief correctly
- ✅ Person pin matching works (if applicable)

---

## Test 5: Pre-Call Briefs - Standard User Upgrade Prompt

**Goal:** Verify Standard users see upgrade prompt

### Setup
1. Log in as Standard user
2. Ensure calendar is connected
3. Create a calendar event with "call" keyword
4. Navigate to `/app/plan`

### Test Steps
1. **Check Daily Plan Page:**
   - Should NOT see pre-call brief cards
   - API should return 402 (Upgrade Required)

### Expected Results
- ✅ Standard users don't see briefs
- ✅ No errors (graceful handling)

---

## Test 6: Pre-Call Briefs - No Calendar Connected

**Goal:** Verify graceful handling when calendar not connected

### Setup
1. Log in as Premium user
2. Ensure calendar is NOT connected
3. Navigate to `/app/plan`

### Test Steps
1. **Check API Response:**
   - API should return success with empty briefs array
   - Message: "Connect your calendar to get pre-call briefs"

### Expected Results
- ✅ No errors
- ✅ Helpful message (if displayed)
- ✅ Feature doesn't break without calendar

---

## Test 7: Pre-Call Briefs - Person Pin Matching

**Goal:** Verify calendar events match to person pins correctly

### Setup
1. Log in as Premium user
2. Create a person pin with name "John Smith"
3. Create calendar event titled "Call with John Smith" (or similar)
4. Ensure event is in next 24 hours
5. Navigate to `/app/plan`

### Test Steps
1. **Check Brief:**
   - Brief should show person name
   - Brief should include action history for that person
   - Brief should reference previous interactions

### Expected Results
- ✅ Person pin matched correctly
- ✅ Brief includes relevant history
- ✅ Brief is personalized to that contact

---

## Quick Test Checklist

### Pattern Detection
- [x] Premium user can access patterns ✅
- [x] Standard user sees upgrade prompt ✅
- [x] Patterns display correctly with insights ✅
- [x] Insufficient data handled gracefully ✅

### Pre-Call Briefs
- [x] Premium user sees briefs for upcoming calls ✅
- [x] Standard user doesn't see briefs (upgrade required) ✅
- [x] Brief content is relevant and helpful ✅
- [x] Person pin matching works ✅
- [x] No calendar = graceful handling ✅

### Performance Timeline
- [x] Premium user can access timeline page ✅
- [x] Standard user sees upgrade prompt ✅
- [x] Summary cards display correctly ✅
- [x] Charts render without errors ✅
- [x] Date range and granularity selection works ✅
- [x] Cron job aggregates data correctly ✅
- [x] Rates capped at 100% ✅

### Content Engine with Voice Learning
- [x] Premium user can create voice profile ✅
- [x] Standard user sees upgrade prompt ✅
- [x] Voice characteristics display correctly ✅
- [x] Manual samples can be added/deleted ✅
- [x] Profile regeneration works ✅
- [x] Sample count is accurate ✅

---

## API Endpoints to Test

### Pattern Detection
```
GET /api/patterns
```
**Premium user:** Returns patterns array  
**Standard user:** Returns 402 with `UPGRADE_REQUIRED`

### Pre-Call Briefs
```
GET /api/pre-call-briefs
```
**Premium user:** Returns briefs array  
**Standard user:** Returns 402 with `UPGRADE_REQUIRED`  
**No calendar:** Returns success with empty array + message

---

## Troubleshooting

### No patterns detected
- **Check:** User has at least 10-15 actions over past 90 days
- **Check:** Actions are in REPLIED or DONE state
- **Check:** SQL functions are installed (migration ran)

### No pre-call briefs
- **Check:** Calendar is connected
- **Check:** Calendar event has "call" keyword in title
- **Check:** Event is within next 24 hours
- **Check:** Access token is valid

### Upgrade prompt not showing
- **Check:** User subscription status (should be Standard, not Premium)
- **Check:** API returns 402 status code
- **Check:** Frontend handles 402 correctly

---

## Test Data Setup (Optional)

If you need to create test data quickly:

```sql
-- Create test actions for pattern detection
-- (Run as Premium test user)
-- Ensure actions span different days of week and action types
-- Mark some as REPLIED, some as DONE

-- Create test calendar event
-- Use Google Calendar or Outlook to create event titled "Call with [Person Name]"
-- Set event for tomorrow
```

---

_Last updated: December 2024_

