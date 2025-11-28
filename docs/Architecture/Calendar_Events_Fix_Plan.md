# Calendar Events Fix Plan

## Problem Analysis

### Current Issues
1. **Not starting from today**: Calendar view starts on Thursday instead of Friday (today)
2. **Missing events**: Not picking up all events from today
3. **Weekend inclusion**: Showing Sunday despite `exclude_weekends` preference
4. **All-day events missing**: All-day events (like "On site with client" on Monday) are not being captured
5. **Date shift**: Tuesday's events showing on Monday (off by one day)

### Root Causes

1. **Date String Manipulation**: `addDaysToDateString()` creates dates in server's local timezone, not user's timezone
2. **All-Day Event Handling**: Google Calendar returns all-day events with `date` (YYYY-MM-DD) instead of `dateTime` (ISO 8601), and we're not handling this
3. **Event Date Matching**: When matching events to days, timezone conversions can shift dates
4. **Weekend Detection**: Weekend detection might be using wrong timezone context
5. **Today Calculation**: "Today" calculation might be using server timezone instead of user timezone

## Solution Approach

### Phase 1: Fix Date Calculations (Timezone-Aware)

**Problem**: Date arithmetic in JavaScript is timezone-sensitive. We need to work entirely in the user's timezone.

**Solution**:
1. Get "today" in user's timezone using `Intl.DateTimeFormat`
2. For each day offset, use simple milliseconds addition (avoids timezone conversion issues)
3. Always format dates in user's timezone for comparison

**Implementation**:
```typescript
// Get date string (YYYY-MM-DD) in user's timezone
function getDateInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', { 
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date); // Returns "YYYY-MM-DD"
}

// Add days to a date, return date string in user's timezone
function addDaysInTimezone(baseDate: Date, days: number, timezone: string): string {
  // Add days in milliseconds (simple, avoids timezone issues)
  const newDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
  return getDateInTimezone(newDate, timezone);
}

// Usage in loop:
const today = new Date();
for (let i = 0; i < daysToShow; i++) {
  const dateStr = addDaysInTimezone(today, i, timezone);
  // ... rest of logic
}
```

### Phase 2: Fix All-Day Event Handling

**Problem**: Google Calendar returns all-day events differently:
- Timed events: `start.dateTime` and `end.dateTime` (ISO 8601)
- All-day events: `start.date` and `end.date` (YYYY-MM-DD)
- **CRITICAL**: `end.date` is EXCLUSIVE - event is only on `start.date` for single-day events

**Solution**:
1. Check for both `dateTime` and `date` properties
2. For all-day events, use `start.date` directly (it's already in YYYY-MM-DD format)
3. For multi-day all-day events, generate all dates between start and end (exclusive)
4. Calculate duration based on date difference

**Implementation**:
```typescript
// In fetchGoogleEvents:
const isAllDay = !item.start.dateTime; // If dateTime is missing, it's all-day

if (isAllDay) {
  // All-day event - use date fields directly
  const startDate = item.start.date; // "2024-12-02" (YYYY-MM-DD)
  const endDate = item.end.date; // "2024-12-03" (exclusive - event is only on Dec 2)
  
  // Calculate duration in days
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  const durationDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  
  events.push({
    id: item.id || "",
    title: item.summary || "No title",
    start: startDate, // Use start.date directly
    end: endDate, // Keep end.date for multi-day handling
    duration: durationDays * 24 * 60, // Convert days to minutes
    isAllDay: true,
  });
} else {
  // Timed event - use dateTime fields
  const start = item.start.dateTime!;
  const end = item.end.dateTime!;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
  
  events.push({
    id: item.id || "",
    title: item.summary || "No title",
    start,
    end,
    duration: Math.round(duration),
    isAllDay: false,
  });
}
```

### Phase 3: Fix Event-to-Date Matching

**Problem**: When matching events to days, we need to ensure we're comparing dates in the same timezone. Also need to handle multi-day all-day events.

**Solution**:
1. For timed events: Convert event start time to user's timezone and extract date
2. For all-day events: Use the date field directly (already YYYY-MM-DD)
3. For multi-day all-day events: Return array of all dates the event spans
4. Compare date strings directly (YYYY-MM-DD format) - both must be in user's timezone

**Implementation**:
```typescript
function getEventDates(event: CalendarEvent, timezone: string): string[] {
  if (event.isAllDay) {
    // All-day event - may span multiple days
    const dates: string[] = [];
    const start = new Date(event.start + 'T00:00:00');
    const end = new Date(event.end + 'T00:00:00'); // end is exclusive
    
    // Generate all dates from start (inclusive) to end (exclusive)
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      dates.push(getDateInTimezone(d, timezone));
    }
    return dates;
  } else {
    // Timed event - typically just one date
    const date = new Date(event.start);
    return [getDateInTimezone(date, timezone)];
  }
}

// In main loop, match events:
const dayEvents = events.filter((event) => {
  const eventDates = getEventDates(event, timezone);
  return eventDates.includes(dateStr);
});
```

### Phase 4: Fix Weekend Filtering

**Problem**: Weekend detection needs to check the day of week in the user's timezone.

**Solution**:
1. Use `Intl.DateTimeFormat` with user's timezone to get day of week
2. Check if day is Saturday or Sunday
3. Skip if `exclude_weekends` is true

**Implementation**:
```typescript
function isWeekend(dateStr: string, timezone: string): boolean {
  // Create date at noon UTC to avoid DST issues
  const date = new Date(dateStr + 'T12:00:00Z');
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short' // 'Sun', 'Mon', etc.
  });
  
  const dayName = formatter.format(date);
  return dayName === 'Sat' || dayName === 'Sun';
}

// Usage in loop:
if (excludeWeekends && isWeekend(dateStr, timezone)) {
  continue; // Skip weekend
}
```

### Phase 5: Fix Today Calculation

**Problem**: "Today" needs to be calculated in user's timezone, not server timezone.

**Solution**:
1. Use `Intl.DateTimeFormat` to get today's date string in user's timezone
2. Always use this as the starting point for the loop

**Implementation**:
```typescript
const timezone = userProfile?.timezone || "UTC";
const todayStr = getDateInTimezone(new Date(), timezone);
```

## Implementation Steps

1. **Create CalendarDateUtils class** (centralize timezone logic):
   - `getToday()`: Get today's date string in user's timezone
   - `addDays(baseDate, days)`: Add days to a date, return date string in user's timezone
   - `isWeekend(dateStr)`: Check if date is weekend in user's timezone
   - `getEventDates(event)`: Get all dates an event falls on (handles multi-day events)
   - `parseEventDate(item)`: Parse Google/Outlook event and return normalized format

2. **Update helper functions**:
   - Fix `getDateInTimezone` to use `Intl.DateTimeFormat` consistently
   - Use simple milliseconds addition for date arithmetic
   - Simplify weekend detection
   - Handle multi-day all-day events

3. **Update event fetching**:
   - Handle both `dateTime` and `date` fields in Google Calendar
   - **CRITICAL**: For all-day events, use `start.date` directly (end.date is exclusive)
   - Handle all-day events in Outlook (check `isAllDay` property)
   - Store event type (all-day vs timed) in `CalendarEvent` type
   - Properly set `timeMin` and `timeMax` for API calls

4. **Update main loop**:
   - Start from `today` Date object
   - Use `addDaysInTimezone` for each day offset (simple milliseconds addition)
   - Check weekend using simplified `isWeekend` function
   - Match events using `getEventDates` which handles multi-day events

5. **Update busy minutes calculation**:
   - For all-day events: Count as full working day (480 minutes) - can be made configurable later
   - For timed events: Calculate overlap with working hours (9 AM - 5 PM)
   - Handle multi-day all-day events correctly

6. **Testing**:
   - Test with user in different timezone (e.g., PST vs EST)
   - Test with all-day events (single day and multi-day)
   - Test with weekend exclusion enabled/disabled
   - Test with events spanning midnight
   - Test with events at DST boundaries
   - Test with multi-day all-day events (conferences, vacations)
   - Test with events at midnight (00:00)
   - Test with recurring events (ensure API expands them)

## CalendarEvent Type Update

```typescript
type CalendarEvent = {
  id: string;
  title: string;
  start: string; // ISO 8601 for timed, YYYY-MM-DD for all-day
  end: string; // ISO 8601 for timed, YYYY-MM-DD for all-day (exclusive for all-day)
  duration: number; // minutes
  isAllDay: boolean; // true if all-day event
};
```

## Code Structure: CalendarDateUtils Class

```typescript
class CalendarDateUtils {
  constructor(private timezone: string) {}
  
  getToday(): string {
    return getDateInTimezone(new Date(), this.timezone);
  }
  
  addDays(baseDate: Date, days: number): string {
    return addDaysInTimezone(baseDate, days, this.timezone);
  }
  
  isWeekend(dateStr: string): boolean {
    return isWeekend(dateStr, this.timezone);
  }
  
  getEventDates(event: CalendarEvent): string[] {
    return getEventDates(event, this.timezone);
  }
  
  parseEventDate(item: any): { start: string, end: string, isAllDay: boolean } {
    // Parse Google/Outlook event and return normalized format
    const isAllDay = !item.start.dateTime;
    return {
      start: item.start.dateTime || item.start.date,
      end: item.end.dateTime || item.end.date,
      isAllDay,
    };
  }
}
```

## Key Principles

1. **Always work in user's timezone**: Never assume server timezone
2. **Use UTC dates at noon**: Avoids DST boundary issues
3. **Handle all-day events separately**: They use different date formats
4. **Compare date strings directly**: YYYY-MM-DD format, no time components
5. **Test edge cases**: DST transitions, midnight boundaries, all-day events

