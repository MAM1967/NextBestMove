# Smart Action Scheduling Algorithm

## Overview

The smart scheduling algorithm ensures that **no more than 2 actions per day per relationship** are scheduled, preventing action overload and spreading actions out over time.

## Current Implementation

### Function: `findNextAvailableActionDate`

**Location:** `web/src/lib/actions/smart-scheduling.ts`

**How it works:**

1. **Input Parameters:**

   - `userId`: User ID
   - `personId`: Relationship ID
   - `proposedDueDate`: The originally proposed due date (from AI, email signal, or manual entry)
   - `maxActionsPerDay`: Maximum actions per day (default: 2)

2. **Algorithm Steps:**

   - Start from the `proposedDueDate` (or today if proposed date is in the past)
   - For each day, check how many pending actions already exist for this relationship on that date
   - Only count actions in `NEW`, `SENT`, or `SNOOZED` states (completed actions don't count)
   - If the day has fewer than `maxActionsPerDay` actions, use that date
   - If the day is full, move to the next day
   - Continue for up to 30 days in the future
   - If no slot is found within 30 days, fall back to the proposed date

3. **Example:**

   ```
   Proposed date: Jan 5
   Existing actions on Jan 5: 1 action
   Result: Jan 5 (1 < 2, so there's space)

   Proposed date: Jan 5
   Existing actions on Jan 5: 2 actions
   Check Jan 6: 0 actions
   Result: Jan 6 (0 < 2, so there's space)

   Proposed date: Jan 5
   Existing actions on Jan 5: 2 actions
   Existing actions on Jan 6: 1 action
   Check Jan 7: 0 actions
   Result: Jan 7 (0 < 2, so there's space)
   ```

## Where It's Used

1. **Email Signal Actions** (`web/src/lib/email/ingestion.ts`)

   - When AI recommends an action from an email, it uses smart scheduling
   - Single action per email (typically)

2. **Meeting Notes Actions** (`web/src/app/api/leads/[id]/meeting-notes/route.ts`)
   - When multiple actions are extracted from meeting notes
   - Actions are created sequentially in a loop
   - Each action calls `findNextAvailableActionDate` separately
   - Since they're created sequentially, each subsequent action sees the previous ones in the database

## Why Actions Might Not Be Spread Out

**If actions were created BEFORE the smart scheduling code was deployed:**

- They would all be scheduled on the same date (the proposed date)
- The smart scheduling only applies to NEW actions created after the code was deployed
- Existing actions are not automatically rescheduled

**To fix existing actions:**

- You would need to manually reschedule them or create a migration script
- Or wait for new actions to be created, which will use smart scheduling

## Batch Scheduling Function ✅ IMPLEMENTED

**Status:** Implemented in `web/src/lib/actions/smart-scheduling.ts`

For efficiency when creating multiple actions at once (e.g., from meeting notes), we've implemented `scheduleMultipleActions` that:

1. Takes an array of proposed actions
2. Fetches all existing pending actions once (instead of per-day queries)
3. Schedules them all at once, ensuring proper spacing
4. Returns an array of scheduled dates
5. More efficient than calling `findNextAvailableActionDate` multiple times sequentially

**Example:**

```typescript
const scheduledActions = await scheduleMultipleActions(
  userId,
  personId,
  [
    { proposedDueDate: "2025-01-05" },
    { proposedDueDate: "2025-01-05" },
    { proposedDueDate: "2025-01-05" },
  ],
  2 // maxActionsPerDay
);
// Result: [
//   { scheduledDate: "2025-01-05", proposedDate: "2025-01-05" },
//   { scheduledDate: "2025-01-05", proposedDate: "2025-01-05" },
//   { scheduledDate: "2025-01-06", proposedDate: "2025-01-05" }
// ]
```

**Where it's used:**

- Meeting notes action extraction (`web/src/app/api/leads/[id]/meeting-notes/route.ts`)
- More efficient than sequential scheduling, especially when multiple actions are extracted from a single meeting note

## Current Limitations

1. **Sequential Creation:** Actions are created one at a time, which works but could be optimized
2. **No Rescheduling:** Existing actions are not automatically rescheduled
3. **30-Day Limit:** If no slot is found within 30 days, it falls back to the proposed date (which might violate the 2-per-day rule)

## Testing

To verify smart scheduling is working:

1. Create multiple actions for the same relationship with the same proposed due date
2. Check that they're spread across multiple days (max 2 per day)
3. Verify that completed actions don't count toward the limit
