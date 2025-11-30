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

## Recommended Approach

### Core Function Signature

```typescript
interface FreeBusySlot {
  start: Date;
  end: Date;
  status: 'free' | 'busy' | 'tentative' | 'out_of_office';
}

interface FreeBusyResult {
  totalMinutesFree: number;
  totalMinutesBusy: number;
  slots: FreeBusySlot[];
}

async function getFreeBusyForDay(
  calendarType: 'google' | 'outlook',
  accessToken: string,
  date: Date,
  workingHours: { start: string; end: string } // e.g., "09:00", "17:00"
): Promise<FreeBusyResult>
```

### Implementation Approach

#### For Google Calendar

Google's API has a `FreeBusy.query` method that checks if queried calendar slots are busy during a selected period.

**Response structure:**
```json
{
  "calendars": {
    "primary": {
      "busy": [
        { "start": "2025-11-29T10:00:00Z", "end": "2025-11-29T11:00:00Z" },
        { "start": "2025-11-29T14:00:00Z", "end": "2025-11-29T15:30:00Z" }
      ]
    }
  }
}
```

**Logic:**
1. Calculate total working hours (e.g., 9am-5pm = 480 minutes)
2. Sum up busy slot durations
3. Subtract from total to get free time

#### For Outlook Calendar

Microsoft's `getSchedule` returns an `availabilityView` string where each character represents a time slot based on the `availabilityViewInterval` parameter (typically 15, 30, or 60 minutes).

**Example response:**
```json
{
  "availabilityView": "111111002222222200000000",
  "availabilityViewInterval": 15
}
```

**Character meanings:**
- `0` = Free
- `1` = Tentative
- `2` = Busy
- `3` = Out of Office
- `4` = Working Elsewhere

**Logic:**
1. Parse the string character by character
2. Multiply character count by interval (e.g., 15 min)
3. Count `0` characters for free time
4. Count `2` characters for busy time

### Minimal Working Implementation

#### Google Calendar Free/Busy

```typescript
async function getGoogleFreeBusy(
  accessToken: string,
  date: Date
): Promise<FreeBusyResult> {
  const timeMin = new Date(date.setHours(9, 0, 0, 0)).toISOString();
  const timeMax = new Date(date.setHours(17, 0, 0, 0)).toISOString();
  
  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/freeBusy',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        timeMin,
        timeMax,
        items: [{ id: 'primary' }]
      })
    }
  );
  
  const data = await response.json();
  const busySlots = data.calendars.primary.busy || [];
  
  // Calculate free time (480 min working day - busy time)
  const busyMinutes = busySlots.reduce((total, slot) => {
    const start = new Date(slot.start);
    const end = new Date(slot.end);
    return total + (end.getTime() - start.getTime()) / 60000;
  }, 0);
  
  return {
    totalMinutesFree: 480 - busyMinutes,
    totalMinutesBusy: busyMinutes,
    slots: busySlots.map(s => ({
      start: new Date(s.start),
      end: new Date(s.end),
      status: 'busy'
    }))
  };
}
```

#### Outlook Calendar Free/Busy

```typescript
async function getOutlookFreeBusy(
  accessToken: string,
  date: Date
): Promise<FreeBusyResult> {
  const startTime = new Date(date.setHours(9, 0, 0, 0)).toISOString();
  const endTime = new Date(date.setHours(17, 0, 0, 0)).toISOString();
  
  const response = await fetch(
    'https://graph.microsoft.com/v1.0/me/calendar/getSchedule',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        schedules: ['me'],
        startTime: { dateTime: startTime, timeZone: 'UTC' },
        endTime: { dateTime: endTime, timeZone: 'UTC' },
        availabilityViewInterval: 15
      })
    }
  );
  
  const data = await response.json();
  const availabilityView = data.value[0]?.availabilityView || '';
  
  // Count free (0) and busy (2) slots
  const freeSlots = (availabilityView.match(/0/g) || []).length;
  const busySlots = (availabilityView.match(/2/g) || []).length;
  
  return {
    totalMinutesFree: freeSlots * 15,
    totalMinutesBusy: busySlots * 15,
    slots: [] // Parse scheduleItems for detailed slots if needed
  };
}
```

### Recommendation for NextBestMove v0.1

**Don't Over-Engineer This**

For MVP, you only need:
1. Total free time in working hours (to determine action count)
2. Basic busy/free detection (not detailed slot analysis)

#### Simplest Approach

```typescript
// Unified wrapper
async function getDailyCapacity(
  provider: 'google' | 'outlook',
  accessToken: string,
  date: Date
): Promise<'micro' | 'light' | 'standard' | 'heavy'> {
  
  const result = provider === 'google' 
    ? await getGoogleFreeBusy(accessToken, date)
    : await getOutlookFreeBusy(accessToken, date);
  
  const freeMinutes = result.totalMinutesFree;
  
  // Map to your capacity levels
  if (freeMinutes < 30) return 'micro';      // 1-2 actions
  if (freeMinutes < 60) return 'light';      // 3-4 actions
  if (freeMinutes < 120) return 'standard';  // 5-6 actions
  return 'heavy';                             // 7-8 actions
}
```

### Key Limitations to Document

1. **Working Hours Assumption**
   - Microsoft's `getSchedule` returns `workingHours` data including days of week, start time, end time, and timezone
   - Google doesn't provide this automatically
   - **Solution:** Ask users for working hours during onboarding, default to 9am-5pm if not provided

2. **Primary Calendar Only**
   - Exchange/Outlook only tracks free/busy on the primary calendar
   - For secondary calendars, you need read permissions and custom logic
   - **For v0.1:** Only check primary calendar

3. **Timezone Handling**
   - Both APIs support timezone parameters
   - **Requirements:**
     - Store user's timezone in your database
     - Convert all times to user's local timezone before display

## Next Steps

1. ⏱ **Determine priority** (P0/P1/P2)
2. ⏱ **Assess current Outlook OAuth implementation** (verify if it exists)
3. ⏱ **Implement unified free/busy calculation** using recommended approach
4. ⏱ **Update capacity calculation** to use new unified function
5. ⏱ **Test edge cases** (DST, all-day events, recurring events)
6. ⏱ **Update working hours handling** to use user preferences

---

## Questions to Answer

- [ ] Does Outlook OAuth flow currently work?
- [ ] What's the current state of Outlook calendar integration?
- [ ] Should we create a unified calendar service abstraction?
- [ ] How do we prioritize this vs other P1 items?
- [ ] What's the user impact if Outlook isn't fully supported?

---

_Last updated: November 29, 2025_

