## Daily Plan Generation Algorithm v2

This document summarizes how `/api/daily-plans/generate` chooses which actions appear on the plan page and how the Fast Win is selected. The logic below reflects the current implementation in `web/src/app/api/daily-plans/generate/route.ts`.

**Version 2 Update:** Includes stale actions insight and visibility (see Section 6).

---

### 1. Candidate Pool

1. Fetch all `actions` for the signed-in user where:
   - `state ∈ {NEW, SNOOZED}`
   - `due_date ≤ target date`
   - If `state === SNOOZED`, only include when `snooze_until ≤ target date` (or `NULL`)
2. Attach related `person_pins` for contextual scoring.
3. Abort with `400` if no candidates remain.

---

### 2. Priority Scoring Heuristics

For each candidate action we compute a numeric score:

| Heuristic Layer                       | Rule                                                                | Score |
| ------------------------------------- | ------------------------------------------------------------------- | ----- |
| **State boost**                       | `REPLIED` → +1000 (not currently in candidate set, kept for future) |
|                                       | `SNOOZED` & due today/past → +800                                   |
| **Action type weight**                | `FOLLOW_UP` +500                                                    |
|                                       | `POST_CALL` +450                                                    |
|                                       | `CALL_PREP` +400                                                    |
|                                       | `OUTREACH` +300                                                     |
|                                       | `NURTURE` +200                                                      |
|                                       | `CONTENT` +100                                                      |
| **Due-date boost** _(FOLLOW_UP only)_ | Due today → +200; overdue 1-3 days → +100                           |
| **Context bonus**                     | Has `person_pins` → +50                                             |

After scoring, the list is sorted descending.

---

### 3. Fast Win Heuristic

The Fast Win is the first action that satisfies `isFastWinCandidate(action)`:

1. `state === REPLIED` → immediate Fast Win.
2. `state === SNOOZED && action_type === FOLLOW_UP && snooze_until ≤ today`.
3. `action_type === FOLLOW_UP && state === NEW`.
4. `action_type === NURTURE`.
5. `action_type === OUTREACH && person_pins != null`.

If no candidate meets the criteria, there is simply no Fast Win; all actions become “regular” actions.

---

### 4. Capacity & Plan Construction

1. Determine capacity from `calculateCapacity(freeMinutes)` (currently defaults to 6 actions when no calendar data is available).
2. Remove the Fast Win (if any) from the ordered list.
3. Take the top `actionCount - 1` remaining actions (because the Fast Win occupies one slot).
4. Persist the plan:
   - Insert row into `daily_plans`
   - Insert ordered rows into `daily_plan_actions`

---

## Top-Down Decision Tree

```
START → Fetch all actions for user
       └─ Filter states → keep NEW/SNOOZED only
              └─ Filter due date → due_date ≤ target date?
                     └─ Filter snooze → (state ≠ SNOOZED) OR (snooze_until ≤ target date)?
                            └─ Candidate list empty? → yes → error "No candidate actions"
                            └─ Compute score(action)
                                   └─ Sort by score DESC
                                          └─ Locate first Fast Win candidate?
                                                 ├─ yes → set Fast Win = candidate and remove it
                                                 └─ no  → Fast Win = null
                                          └─ Determine capacity (default 6)
                                          └─ Take remaining top (capacity - fastWinSlot) actions
                                          └─ Persist daily_plan + daily_plan_actions
```

---

## Visual Pipeline (ASCII)

```
[Raw Actions Table]
        │
        ▼
[State Filter]
  keep NEW/SNOOZED
        │
        ▼
[Due/Snooze Filter]
  due_date ≤ today
  snooze_until ≤ today (when snoozed)
        │
        ▼
[Candidate List] ─▶ (empty?) ──▶ error
        │
        ▼
[Scoring Engine]
  + State boosts
  + Action type weights
  + Due-date bonus (FOLLOW_UP)
  + Person pin bonus
        │
        ▼
[Sorted Candidates]
        │
        ├───────────────┐
        │               │
        ▼               ▼
[Find Fast Win]   (if none) ───────────┐
        │                              │
        ▼                              │
[Fast Win Action]                      │
        └───────────────┐              │
                        ▼              │
              [Remaining Actions]      │
                        │              │
                        ▼              │
               [Take top N = capacity] │
                        │              │
                        ▼              │
               [Create Plan Record] ◀──┘
                        │
                        ▼
              [daily_plan_actions table]
```

---

### Key Takeaways

- FOLLOW_UP actions dominate by design; they have the highest base weight plus due-date boosts.
- Fast Win is purely heuristic; whichever candidate meets the “quick win” conditions first wins.
- The system uses calendar-based capacity when available, defaulting to six actions per day when no calendar is connected.

## 6. Stale Actions Consideration (v2)

**Problem:** Actions created more than 7 days ago that remain in NEW state (not snoozed) may indicate:

- Actions that were once important but are now overlooked
- Actions that may no longer be relevant
- Actions that need user review to determine if they should be prioritized, snoozed, or archived

**Solution:**

- Stale actions (NEW state, not snoozed, >7 days old) are surfaced in the Insights page
- Users can review these actions and decide whether to:
  - Prioritize them (they'll appear in future plans if they score high enough)
  - Snooze them (if timing isn't right)
  - Archive them (if no longer relevant)
- Stale actions are NOT automatically excluded from plan generation - they can still appear if they score high enough
- The Insights page provides visibility into these actions so users can make informed decisions

**Algorithm v2 Notes:**

- Stale actions are identified but not automatically filtered out of plan generation
- The priority scoring algorithm remains the same - stale actions can still score high if they're follow-ups due today, etc.
- The Insights page provides a dedicated view for reviewing stale actions
- Priority transparency is implemented with H/M/L badges and info tooltips
