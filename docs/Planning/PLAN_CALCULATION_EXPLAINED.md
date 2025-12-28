# Daily Plan Calculation Explained

This document explains how the daily plan is generated, including how calendar events affect capacity and action selection.

---

## Overview

The daily plan generation process:
1. **Calculate Capacity** - Based on calendar free/busy data
2. **Fetch Candidate Actions** - Get all eligible actions
3. **Score Actions** - Prioritize actions based on multiple factors
4. **Select Actions** - Choose actions up to capacity limit

---

## Step 1: Calculate Capacity from Calendar

### How Calendar Events Affect Capacity

**Working Hours:** 9:00 AM - 5:00 PM (8 hours = 480 minutes)

**Example: Today with 3 Events**
- Event 1: "Test" - 9:00 AM - 10:00 AM (60 minutes)
- Event 2: "Webinar" - 11:00 AM - 1:00 PM (120 minutes)
- Event 3: "Call with Test" - 2:30 PM - 3:30 PM (60 minutes)

**Calculation:**
- Total busy time: 60 + 120 + 60 = **240 minutes (4 hours)**
- Available time: 480 - 240 = **240 minutes (4 hours)**
- Capacity level: 240 minutes > 120 minutes → **"heavy"**
- Suggested actions: **8 actions**

### Capacity Levels

| Available Time | Capacity Level | Actions Per Day |
|---------------|----------------|-----------------|
| < 30 minutes  | micro          | 1 action        |
| 30-59 minutes | light          | 3 actions       |
| 60-119 minutes| standard       | 6 actions       |
| ≥ 120 minutes | heavy          | 8 actions       |
| No calendar   | default        | 6 actions       |

### Capacity Calculation Code

```typescript
// From capacity.ts
function calculateCapacityFromFreeMinutes(freeMinutes: number | null) {
  if (freeMinutes === null || freeMinutes < 30) {
    return { level: "micro", suggestedActionCount: 1 };
  } else if (freeMinutes < 60) {
    return { level: "light", suggestedActionCount: 3 };
  } else if (freeMinutes < 120) {
    return { level: "standard", suggestedActionCount: 6 };
  } else {
    return { level: "heavy", suggestedActionCount: 8 };
  }
}
```

---

## Step 2: Fetch Candidate Actions

**Eligible Actions:**
- State: `NEW` or `SNOOZED`
- Due date: Today or in the past
- For `SNOOZED`: Only if `snooze_until <= today` or `NULL`

**Query:**
```sql
SELECT * FROM actions
WHERE user_id = ?
  AND state IN ('NEW', 'SNOOZED')
  AND due_date <= ?
ORDER BY due_date ASC, created_at DESC
```

---

## Step 3: Score Actions (Priority Calculation)

Actions are scored based on multiple factors:

### Scoring Factors

1. **State-Based Scoring** (Highest Priority)
   - `REPLIED`: +1000 points (highest - respond to replies immediately)
   - `SNOOZED` (due today): +800 points (snoozed action now due)

2. **Action Type Scoring**
   - `POST_CALL`: +450 points
   - `CALL_PREP`: +400 points
   - `FOLLOW_UP`: +500 points (base)
     - Due today: +200 bonus
     - Overdue 1-3 days: +100 bonus
   - `OUTREACH`: +300 points
   - `NURTURE`: +200 points
   - `CONTENT`: +100 points

3. **Context Bonus**
   - Has `person_pins`: +50 points (more context available)

### Example Scoring

**Action 1: Follow-up on reply (REPLIED state)**
- Base: 1000 (REPLIED)
- Type: +500 (FOLLOW_UP)
- Context: +50 (has person_pins)
- **Total: 1550 points**

**Action 2: Call prep for tomorrow**
- Type: +400 (CALL_PREP)
- Context: +50 (has person_pins)
- **Total: 450 points**

**Action 3: Outreach to new contact**
- Type: +300 (OUTREACH)
- **Total: 300 points**

---

## Step 4: Select Actions

### Selection Process

1. **Sort by Score** - Highest score first
2. **Select Fast Win** - First fast win candidate (if any)
   - Fast Win criteria:
     - State = `REPLIED` (respond to recent reply)
     - Action type = `FOLLOW_UP` with person_pins
     - Due today or overdue
3. **Select Remaining Actions** - Up to capacity limit
   - If capacity = 8 actions:
     - 1 Fast Win
     - 7 regular actions (capacity - 1)

### Example: Today with 8-Action Capacity

**Candidate Actions (scored and sorted):**
1. Follow-up on reply (REPLIED) - 1550 points → **Fast Win**
2. Call prep - 450 points → **Selected**
3. Follow-up due today - 700 points → **Selected**
4. Outreach - 300 points → **Selected**
5. Nurture - 250 points → **Selected**
6. Content - 100 points → **Selected**
7. Another outreach - 300 points → **Selected**
8. Another nurture - 250 points → **Selected**
9. Low priority action - 50 points → **Not selected** (capacity reached)

**Final Plan:**
- Fast Win: Follow-up on reply
- Regular Actions: 7 actions (items 2-8)

---

## How Calendar Events Affect Plan Generation

### Example: Today with 3 Events (4 hours busy, 4 hours available)

**Capacity Calculation:**
- Available: 240 minutes (4 hours)
- Capacity: **Heavy (8 actions)**

**Plan Generation:**
1. Gets capacity: 8 actions
2. Scores all candidate actions
3. Selects 1 Fast Win + 7 regular actions = **8 total actions**

**Result:**
- Plan respects calendar capacity
- Actions fit within available time (4 hours)
- Each action estimated at ~30 minutes average
- 8 actions × 30 minutes = 240 minutes = 4 hours ✓

---

## Edge Cases

### Fully Booked Day (8 hours busy, 0 hours available)
- Available: 0 minutes
- Capacity: **Micro (1 action)**
- Plan: 1 Fast Win only (if available)

### Empty Calendar (0 hours busy, 8 hours available)
- Available: 480 minutes (8 hours)
- Capacity: **Heavy (8 actions)**
- Plan: 1 Fast Win + 7 regular actions

### Partial Day (2 hours busy, 6 hours available)
- Available: 360 minutes (6 hours)
- Capacity: **Heavy (8 actions)**
- Plan: 1 Fast Win + 7 regular actions

---

## Cache Strategy

**Cache TTL:**
- Today: 5 minutes (frequently changes)
- Future dates: 10 minutes
- Past dates: 1 hour

**Sync on Login:**
- Cache invalidated for next 7 days
- Fresh data fetched for today
- `last_sync_at` updated in database

---

## Verification

To verify plan respects calendar capacity:

1. **Check Calendar Events View** (Settings → Calendar)
   - See events for today
   - See calculated capacity

2. **Check Daily Plan**
   - Capacity badge shows level (micro/light/standard/heavy)
   - Number of actions ≤ capacity
   - Fast Win + regular actions = total actions

3. **Compare**
   - Calendar shows: "Available: 4.0h, Capacity: 8 actions"
   - Plan shows: "8 actions" (1 Fast Win + 7 regular)
   - ✓ Matches!

---

## Summary

**Today with 3 Events:**
- **Busy:** 4 hours (3 events totaling 240 minutes)
- **Available:** 4 hours (240 minutes)
- **Capacity:** Heavy (8 actions)
- **Plan:** 1 Fast Win + 7 regular actions = 8 total
- **Time per action:** ~30 minutes average
- **Total time needed:** 8 × 30 = 240 minutes = 4 hours ✓

The plan generation algorithm ensures that:
1. Calendar capacity is respected
2. Actions are prioritized by importance
3. Fast Win is always included (if available)
4. Total actions never exceed capacity
















