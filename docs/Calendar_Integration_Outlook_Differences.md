# Outlook Calendar vs Google Calendar API Differences

**Status:** ⏱ Documented - Awaiting recommended approach  
**Priority:** TBD  
**Date:** November 29, 2025

## Overview

Significant differences exist between Google Calendar and Outlook Calendar APIs, especially for free/busy calculations and timezone handling. This document captures the key differences and considerations for implementing Outlook Calendar support.

---

## Major Differences

### 1. API Structure & Authentication

**Google Calendar:**
- Uses OAuth 2.0
- Simpler REST API
- Returns events directly

**Outlook/Microsoft Graph:**
- More complex API structure
- Uses Microsoft Identity Platform
- Different scopes required

### 2. Free/Busy Queries

**Google Calendar:**
- Has dedicated `freebusy.query` endpoint
- Returns free/busy blocks efficiently
- Simple to use

**Outlook:**
- ❌ No dedicated free/busy endpoint
- Must fetch all events and calculate manually
- OR use `findMeetingTimes` API (more complex)
- Requires manual calculation of free time gaps

### 3. Timezone Handling ⚠️ **BIGGEST DIFFERENCE**

**Google Calendar:**
- Returns times in UTC by default with `dateTime` field
- Includes `timeZone` field for each event
- Easier to work with - just convert UTC to user's timezone

**Outlook Calendar:**
- Can return times in original timezone OR UTC depending on headers
- Uses `Prefer: outlook.timezone="..."` header to specify response timezone
- Events can be in different timezones (meeting organizer's timezone vs attendee's timezone)
- More complex to handle recurring events across DST boundaries

**Common Timezone Pitfalls:**
- User's calendar timezone vs event timezone vs system timezone
- DST transitions (events can shift by 1 hour)
- All-day events might show as previous day in different timezones
- Recurring events across DST boundaries

**Best Practice:**
- Always normalize to UTC for calculations
- Store user's preferred timezone separately
- Convert back to user's timezone only for display

### 4. All-Day Events

**Google:**
- Uses `date` field (no time component) like `"2024-11-29"`

**Outlook:**
- Uses `isAllDay: true` boolean
- `start`/`end` still have times (usually midnight)
- Requires different handling logic

### 5. Recurring Events

**Google:**
- Returns recurring events with recurrence rules (RRULE format)
- Standard format, well-documented

**Outlook:**
- Similar but uses `recurrence` object with different structure
- Both require expansion to get individual instances

### 6. Free/Busy Calculation Complexity

#### Google Calendar (Simpler):
```javascript
// Simpler - use freebusy endpoint
const response = await calendar.freebusy.query({
  timeMin: startTime,
  timeMax: endTime,
  items: [{ id: 'primary' }]
});
// Returns busy blocks directly
```

#### Outlook Calendar (More Complex):
```javascript
// More complex - fetch events and calculate
const events = await graphClient
  .api('/me/calendarview')
  .query({ startDateTime: start, endDateTime: end })
  .get();

// Must manually:
// 1. Filter out free/available events
// 2. Handle timezone conversions
// 3. Merge overlapping blocks
// 4. Calculate free time gaps
```

---

## Recommendation for NextBestMove

Since we're calculating "free minutes", we'll need to:

1. ✅ Fetch events in UTC (set appropriate headers/params)
2. ✅ Normalize all times to UTC for comparison
3. ✅ Handle all-day events separately (they don't consume "minutes")
4. ✅ Merge overlapping events before calculating free time
5. ✅ Convert final results to user's timezone for display

---

## Current Implementation Status

- ✅ Google Calendar integration: **Complete**
  - OAuth flow working
  - Free/busy calculation working
  - Timezone handling working
  - All-day events handled

- ⏱ Outlook Calendar integration: **Pending**
  - OAuth flow: Status unknown (needs verification)
  - Free/busy calculation: Not implemented
  - Timezone handling: Needs special attention
  - All-day events: Needs different handling

---

## Next Steps

1. ⏱ **Await recommended approach** from user
2. ⏱ **Determine priority** (P0/P1/P2)
3. ⏱ **Assess current Outlook OAuth implementation** (verify if it exists)
4. ⏱ **Design unified free/busy calculation** that works for both providers
5. ⏱ **Implement Outlook-specific timezone handling**
6. ⏱ **Test edge cases** (DST, all-day events, recurring events)

---

## Questions to Answer

- [ ] Does Outlook OAuth flow currently work?
- [ ] What's the current state of Outlook calendar integration?
- [ ] Should we create a unified calendar service abstraction?
- [ ] How do we prioritize this vs other P1 items?
- [ ] What's the user impact if Outlook isn't fully supported?

---

_Last updated: November 29, 2025_

