# Action Auto-Generation Strategy

## NextBestMove v0.1 - Revenue-Driven Action Flow

**Last Updated:** 2025-12-08  
**Status:** Strategy Document - Implementation Plan (Refined with tactical improvements)

---

## Key Refinements (v2)

This document has been refined based on strategic review to address critical timing and user experience issues:

### Critical Improvements

1. **FOLLOW_UP Auto-Creation (Zero Friction)**

   - Changed from "user chooses to schedule" to "auto-create immediately"
   - No modal, no decisions - just a toast notification with edit option
   - Smart default dates based on lead engagement history

2. **Calendar Timing (Timezone-Aware)**

   - Changed from daily cron to hourly with timezone filtering
   - Ensures 24-hour accuracy for CALL_PREP across all user timezones
   - POST_CALL created real-time (within minutes of call ending)

3. **Flood Protection**

   - Maximum 15 pending actions per user
   - Maximum 3 NURTURE actions per day
   - Special handling for returning users (inactive 7+ days)

4. **Action Cleanup**

   - Auto-archive stale actions (7+ days overdue, no interaction)
   - Prevents action list from becoming overwhelming

5. **Action Context**

   - Store "why was this created?" in action notes
   - Display in UI to build trust in automation

6. **CONTENT Spacing**
   - Spread across week (Monday/Wednesday) instead of all on Monday
   - Reduces decision fatigue on busiest day

### What Was Not Adopted (For v0.1)

- **Action Suggestions Layer:** Adds friction, conflicts with zero-friction philosophy
- **Full Lead Temperature System:** Too complex for v0.1, simplified to basic dead lead detection (90+ days)
- **Detailed Code Examples:** Removed specific TypeScript code that doesn't fit our architecture

---

## Executive Summary

This document outlines a comprehensive strategy for **automatic action generation** that keeps users engaged while driving revenue. The core principle: **Actions should flow naturally from user activity with minimal manual input required**. Users primarily interact by completing, snoozing, or dismissing suggested actions rather than creating them manually.

**Key Insight:** Manual action creation is a friction point. The system should intelligently generate actions based on:

- User behavior (leads added, replies received, calls scheduled)
- Time-based triggers (follow-ups, nurture cycles)
- Calendar events (call prep, post-call follow-ups)
- Weekly rhythm (content prompts from summaries)

---

## Current State Analysis

### ✅ Currently Auto-Generated

1. **OUTREACH Actions**
   - **Trigger:** New lead created
   - **Implementation:** ✅ Active in `/api/leads/route.ts`
   - **Due Date:** Same day as lead creation
   - **Fallback:** Daily plan generator creates OUTREACH actions for active leads when no candidate actions exist

### ✅ Implemented (Auto-Generation)

2. **FOLLOW_UP Actions** ✅

   - **Trigger:** User marks action as "Got a reply"
   - **Implementation:** ✅ Active in `/app/actions/page.tsx` - `handleGotReply()` function
   - **Due Date:** 2-3 days out (smart default calculated automatically)
   - **Status:** ✅ Fully implemented - Auto-creates FOLLOW_UP with toast notification
   - **Note:** Modal (`FollowUpSchedulingModal`) is only used for editing/adjusting the date if user clicks "Adjust" in toast

### ✅ Implemented (Auto-Generation)

3. **CALL_PREP Actions** ✅ **NEX-32**

   - **Trigger:** Calendar event detected 24 hours before call
   - **Implementation:** ✅ Active in `/api/cron/create-call-prep-actions/route.ts`
   - **Due Date:** Day before the call
   - **Status:** ✅ Implemented - Hourly cron with timezone filtering

4. **POST_CALL Actions** ✅ **NEX-31**

   - **Trigger:** Calendar event passes (call ended) + no POST_CALL action exists for that event
   - **Implementation:** ✅ Active in `/api/cron/create-post-call-actions/route.ts`
   - **Due Date:** Same day as call (or next day if call is late in day)
   - **Status:** ✅ Implemented - Hourly cron detects ended calls

5. **NURTURE Actions** ✅ **NEX-33**

   - **Trigger:** Lead hasn't been contacted in X days (default: 21 days)
   - **Implementation:** ✅ Active in `/api/cron/create-nurture-actions/route.ts`
   - **Due Date:** When trigger fires
   - **Status:** ✅ Implemented - Daily cron with flood protection (max 3 per day)

6. **Enhanced Call Detection** ✅ **NEX-30**
   - **Trigger:** Calendar event detection for video conferencing platforms
   - **Implementation:** ✅ Enhanced `isLikelyCall()` in `calendar-detection.ts`
   - **Status:** ✅ Implemented - Detects Zoom, Google Meet, Teams, etc.

### ✅ Implemented (Auto-Generation)

7. **CONTENT Actions** ✅

   - **Trigger:** Weekly summary generates content prompts (if user completed ≥6 actions)
   - **Implementation:** ✅ Active in `/lib/summaries/generate-weekly-summary.ts` - Converts prompts to CONTENT actions
   - **Due Date:** Spread across week (WIN_POST → Monday, INSIGHT_POST → Wednesday, or Monday if only one prompt)
   - **Status:** ✅ Fully implemented - Auto-converts content prompts to CONTENT actions when weekly summary is generated

---

## Recommended Auto-Generation Strategy

### Core Principles

1. **Zero-Friction Default:** All actions auto-generate; users only interact by completing/snoozing/dismissing
2. **Revenue-Focused:** Prioritize actions that directly drive revenue (follow-ups, outreach, call prep)
3. **Context-Aware:** Use calendar, lead history, and user behavior to create timely, relevant actions
4. **No Manual Creation in v0.1:** Remove manual action creation UI; focus on intelligent auto-generation

---

## Detailed Auto-Generation Rules

### 1. OUTREACH Actions ✅ (Implemented)

**When Created:**

- Immediately when a new lead is added
- Fallback: When daily plan generation finds no candidate actions, creates OUTREACH actions for active leads without recent actions

**Due Date Logic:**

- **New lead:** Same day (to capitalize on momentum)
- **Fallback generation:** Same day (to fill empty plans)

**Prevention Logic:**

- Don't create if lead already has a NEW OUTREACH action
- Don't create if lead was snoozed
- Don't create if lead is archived

**Revenue Impact:** ⭐⭐⭐⭐⭐ (Direct: new conversations)

---

### 2. FOLLOW_UP Actions ⚠️ (Partially Implemented - Needs Zero-Friction)

**When Created:**

- **User marks action as "Got a reply" → System auto-creates FOLLOW_UP immediately**
- **Zero-friction approach:** No modal, no user decision required. Follow-up is automatically created with smart default date.
- **User can adjust:** Toast notification shows "✓ Follow-up scheduled for Wednesday. [Adjust]" - user can click to change date if needed
- **Alternative Trigger (Future Enhancement):** Auto-create if OUTREACH action marked "Done - no reply" after 3-5 days (user can snooze if not ready)

**Due Date Logic:**

- **Smart Default Calculation:**
  - Standard: 2-3 days out from "Got a reply" date
  - Hot lead (replied within 24h): 1 day out (faster follow-up for engaged leads)
  - Slow lead (avg reply time >72h): 5 days out (give them more time)
- User can adjust date via toast notification or action edit

**Prevention Logic:**

- Only one FOLLOW_UP per lead at a time (don't create if existing NEW/SNOOZED FOLLOW_UP)
- Don't create if lead is archived

**Revenue Impact:** ⭐⭐⭐⭐⭐ (Direct: keeps conversations moving forward)

**Implementation Notes:**

- **Remove modal/choice:** When user clicks "Got a reply", immediately:
  1. Update action state to REPLIED
  2. Auto-create FOLLOW_UP action with calculated due date
  3. Show toast: "✓ Follow-up scheduled for [date]. [Adjust]" (link to edit)
- Create action via `/api/actions` endpoint
- Link to same `person_id` as original action
- Set `auto_created: true`
- Store context in `notes`: "Auto-created after reply on [date]" for transparency

---

### 3. CALL_PREP Actions ✅ (Implemented - NEX-32)

**When Created:**

- **24 hours before a detected call:**
  - Scan calendar events for next 24-48 hours
  - If event is detected as a "call" (via `isLikelyCall()`)
  - And event matches a lead (via `matchEventToLead()`)
  - And no CALL_PREP action exists for this event/lead combination
  - Create CALL_PREP action

**Due Date Logic:**

- Day before the call (to ensure preparation time)
- If call is tomorrow morning (<24h away), create for today

**Prevention Logic:**

- Don't create if CALL_PREP already exists for this event/lead
- Don't create if lead is archived
- Don't create if call is more than 48 hours away (too early)

**Revenue Impact:** ⭐⭐⭐⭐ (Indirect: better call outcomes → more closed deals)

**Implementation Notes:**

- **CRITICAL: Use hourly cron with timezone awareness**
  - Problem: Daily cron at fixed time fails for users across timezones
  - Solution: Run cron hourly, filter users where local time = 9 AM
  - This ensures 24-hour window accuracy for all users
- Query calendar events for next 24-48 hours
- Use existing `detectUpcomingCalls()` function
- Create actions via `/api/actions` endpoint
- Store event ID or link in action `notes` field for reference
- **Alternative (Future):** Event-based triggers when calendar syncs

---

### 4. POST_CALL Actions ✅ (Implemented - NEX-31)

**When Created:**

- **Real-time creation after call ends:**
  - **Preferred:** When calendar sync detects a call just ended (event-based trigger)
  - **Fallback:** Hourly cron that checks for calls that ended in last hour
  - If event was detected as a "call" (via `isLikelyCall()`)
  - And event matches a lead (via `matchEventToLead()`)
  - And no POST_CALL action exists for this event/lead combination
  - Create POST_CALL action **immediately**

**Due Date Logic:**

- Same day if call ended before 3 PM
- Next day if call ended after 3 PM (gives user time)

**Prevention Logic:**

- Don't create if POST_CALL already exists for this event/lead
- Don't create if lead is archived
- Only create if call happened (don't create for future calls)

**Revenue Impact:** ⭐⭐⭐⭐ (Indirect: timely follow-ups → higher conversion)

**Implementation Notes:**

- **CRITICAL: Real-time creation is essential**
  - POST_CALL actions are highest-leverage when fresh
  - User should see action in daily plan within minutes of call ending
  - **When action is created:**
    1. Create action immediately
    2. Invalidate user's daily plan cache
    3. Action appears on next page refresh
- **Primary approach:** Event-based trigger when calendar syncs
- **Fallback:** Hourly cron checks for calls ended in last hour
- Match to leads using existing logic
- Create actions via `/api/actions` endpoint
- Store event ID in action `notes` for reference

---

### 5. NURTURE Actions ✅ (Implemented - NEX-33)

**When Created:**

- **Lead hasn't been contacted in X days:**
  - Default: 21 days (configurable per user in future)
  - Query all ACTIVE leads
  - For each lead, find most recent action (any type, any state)
  - If last action was >21 days ago OR lead has no actions
  - Create NURTURE action

**Due Date Logic:**

- When trigger fires (same day)

**Prevention Logic:**

- Don't create if lead already has a NEW/SNOOZED NURTURE action
- Don't create if lead was contacted within last 21 days
- Don't create if lead is archived or snoozed
- Only create 1 NURTURE action per lead per cycle
- **CRITICAL: Flood Protection**
  - Maximum 3 NURTURE actions per day per user
  - If user returns after vacation (inactive 7+ days), limit to 2-3 total actions per day (skip NURTURE, prioritize FOLLOW_UP/OUTREACH)
  - Prioritize leads by:
    1. Most recent engagement (recent replies)
    2. Highest historical reply rate
    3. Shortest time since last contact

**Revenue Impact:** ⭐⭐⭐ (Indirect: keeps relationships warm)

**Implementation Notes:**

- Create a cron job that runs daily
- Query leads with their most recent action date
- **Apply flood protection before creating:**
  - Check user's inactive days (if >= 7, skip NURTURE)
  - Sort eligible leads by priority
  - Create only top 3 NURTURE actions
  - Others will be created in subsequent days (spreads load)
- **Dead Lead Detection (v0.1 Simple Version):**
  - If lead has no response in 90+ days and no recent engagement, suggest archiving instead of creating NURTURE
  - Store suggestion in notes or separate table (future: show in UI)

**Future Enhancement:**

- Make nurture interval configurable per user (14, 21, 30 days)
- Full lead temperature system (hot/warm/cold/dead) for v0.2

---

### 6. CONTENT Actions ⚠️ (Needs Action Conversion - P2 Priority)

**When Created:**

- **Weekly summary generates content prompts:**
  - Weekly summary runs Sunday night / Monday morning
  - If user completed ≥6 actions in the week
  - And content prompts were generated (1-2 prompts)
  - Convert each content prompt to a CONTENT action

**Due Date Logic:**

- **Spread across week (prevents Monday overload):**
  - Win post → Monday (start week with momentum)
  - Insight/process post → Wednesday (midweek thought leadership)
  - If only one prompt → Monday
- This aligns with "Friday light mode" from PRD and reduces decision fatigue

**Prevention Logic:**

- Don't create if content prompt was already converted to action
- Don't create if user archived the content prompt
- Limit to 2 CONTENT actions per week

**Revenue Impact:** ⭐⭐ (Indirect: thought leadership → inbound)

**Implementation Notes:**

- Modify weekly summary generation to create CONTENT actions
- Link action to `content_prompt_id` (may need schema change)
- Or create action and mark prompt as "converted"
- Store prompt draft text in action `notes` for user reference

---

## User Journey & Action Flow

### Week 1: New User Onboarding

**Day 1:**

- User adds 3 leads → 3 OUTREACH actions created
- Daily plan: 3 OUTREACH actions (Fast Win + 2 regular)

**Day 2:**

- User completes 2 OUTREACH actions → marks "Done - no reply"
- Daily plan: 1 remaining OUTREACH action

**Day 3:**

- User completes OUTREACH → marks "Got a reply" → schedules follow-up
- **System creates:** 1 FOLLOW_UP action (due in 2-3 days)

### Week 2: Momentum Building

**Day 8:**

- User adds 2 more leads → 2 OUTREACH actions created
- Follow-up from Day 3 is now due → appears in daily plan
- **System detects:** Call scheduled for Day 10
- **System creates:** CALL_PREP action (due Day 9)

**Day 9:**

- Daily plan includes CALL_PREP action
- User completes CALL_PREP → marks "Done"

**Day 10:**

- Call happens
- **System detects:** Call ended
- **System creates:** POST_CALL action (due Day 10 or 11)

**Day 11:**

- Daily plan includes POST_CALL action
- User completes POST_CALL → adds notes about next steps

### Week 3: Nurture & Content

**Day 15:**

- **System detects:** Lead from Week 1 hasn't been contacted in 21 days
- **System creates:** NURTURE action
- Daily plan includes NURTURE action

**Day 21 (Sunday):**

- Weekly summary runs
- User completed 8 actions this week
- **System generates:** 2 content prompts (win post + insight post)
- **System creates:** 2 CONTENT actions (due Monday/Wednesday)

**Day 22 (Monday):**

- Daily plan includes 1 CONTENT action (win post)

---

## Revenue-Driven Prioritization

### Action Type Revenue Impact

1. **FOLLOW_UP** ⭐⭐⭐⭐⭐

   - **Why:** Keeps warm conversations moving toward revenue
   - **Frequency:** After every reply
   - **Auto-generate:** Always

2. **OUTREACH** ⭐⭐⭐⭐⭐

   - **Why:** Opens new revenue opportunities
   - **Frequency:** One per new lead
   - **Auto-generate:** Always

3. **POST_CALL** ⭐⭐⭐⭐

   - **Why:** Timely follow-up after calls increases close rate
   - **Frequency:** After every call
   - **Auto-generate:** Always

4. **CALL_PREP** ⭐⭐⭐⭐

   - **Why:** Better prepared = better call outcomes
   - **Frequency:** 24h before each call
   - **Auto-generate:** Always

5. **NURTURE** ⭐⭐⭐

   - **Why:** Keeps relationships warm for future opportunities
   - **Frequency:** Every 21 days for inactive leads
   - **Auto-generate:** Always (but limit to 2-3 per day)

6. **CONTENT** ⭐⭐
   - **Why:** Thought leadership can drive inbound
   - **Frequency:** 1-2 per week (if user active)
   - **Auto-generate:** Weekly (if threshold met)

---

## Implementation Priority

### Phase 1: Critical Revenue Path (P0) 🚨 ✅ COMPLETE

**Goal:** Complete the core revenue-generating action flow

1. ✅ **OUTREACH** - Already implemented
2. ✅ **FOLLOW_UP** - ✅ Fully implemented (auto-creates with toast)
3. ✅ **POST_CALL** - ✅ Implemented (NEX-31)

**Impact:** ✅ All Phase 1 features complete. These three action types drive 90% of revenue.

### Phase 2: Enhanced Revenue Path (P1) 📈

**Goal:** Improve call outcomes and maintain relationships

4. ✅ **CALL_PREP** - ✅ Implemented (NEX-32)
5. ✅ **NURTURE** - ✅ Implemented (NEX-33)
6. ✅ **Enhanced Call Detection** - ✅ Implemented (NEX-30)

**Impact:** ✅ All Phase 2 features complete. Increases conversion rates and prevents lead decay.

### Phase 3: Engagement & Thought Leadership (P2) 💡 ✅ COMPLETE

**Goal:** Keep users engaged and build brand

7. ✅ **CONTENT** - ✅ Fully implemented
   - **Implementation:** Auto-converts content prompts to CONTENT actions when weekly summary is generated
   - **Due Dates:** WIN_POST → Monday, INSIGHT_POST → Wednesday (or Monday if only one prompt)

**Impact:** ✅ Complete. Improves user engagement and retention.

---

## Technical Implementation Details

### Cron Jobs / Scheduled Functions

**Option 1: Vercel Cron with Hourly Processing (Recommended for v0.1)**

- Create `/api/cron/create-actions` endpoint
- Configure in `vercel.json`:
  ```json
  {
    "crons": [
      {
        "path": "/api/cron/create-actions",
        "schedule": "0 * * * *"
      }
    ]
  }
  ```
- **Hourly execution with timezone filtering:**
  - Run every hour
  - Filter users where local time = 9 AM (for CALL_PREP)
  - Filter users where local time = 6 PM (for POST_CALL check)
  - This ensures 24-hour window accuracy across all timezones
- **For POST_CALL:** Also support event-based triggers when calendar syncs (real-time)

**Option 2: Supabase Edge Functions**

- Create edge function that runs hourly
- Query calendar and create actions
- Better for user timezone-aware scheduling

**Option 3: Background Jobs (Future)**

- Use BullMQ or similar for more complex scheduling
- Better for event-based triggers

### Action Creation Endpoint

All auto-generated actions should use the existing `/api/actions` endpoint:

```typescript
POST /api/actions
{
  "action_type": "FOLLOW_UP",
  "person_id": "...",
  "due_date": "2025-12-10",
  "description": "Follow up with John Doe",
  "auto_created": true,
  "notes": "..." // Optional: store event ID, context, etc.
}
```

### Prevention Queries

Before creating any action, check:

```sql
SELECT id FROM actions
WHERE user_id = ?
  AND person_id = ?
  AND action_type = ?
  AND state IN ('NEW', 'SNOOZED')
  AND due_date >= CURRENT_DATE
LIMIT 1
```

If result exists, don't create duplicate.

### Action Generation Limits

**Problem:** Unconstrained auto-generation can flood users, especially after vacations or inactivity.

**Solution:**

- **Maximum Pending Actions:** 15 actions per user
- Before creating new actions, check existing pending count
- If user has 15+ pending actions, skip generation (except critical: FOLLOW_UP, POST_CALL)
- Prioritize action creation by revenue impact:
  1. FOLLOW_UP (after reply)
  2. POST_CALL (after call)
  3. CALL_PREP (before call)
  4. OUTREACH (new leads)
  5. NURTURE (max 3 per day)

### Action Cleanup Job

**Problem:** Auto-generated actions can accumulate if user doesn't complete them.

**Solution:**

- **Daily cleanup job** (runs at midnight user time):
  - Archive actions that are:
    1. Auto-created (`auto_created = true`)
    2. Overdue by 7+ days
    3. User never interacted with (state = NEW, `updated_at = created_at`)
  - Add note: "Auto-archived: No user interaction within 7 days of due date"
  - This prevents action list from becoming overwhelming
  - Self-corrects when auto-generation is too aggressive

### Action Context ("Why Was This Created?")

**Problem:** Users may wonder why certain actions appeared.

**Solution:**

- Store context in action `notes` field:
  - FOLLOW_UP: "Auto-created after reply on [date]"
  - POST_CALL: "Call with [name] ended on [date]"
  - CALL_PREP: "Call with [name] scheduled for [date/time]"
  - NURTURE: "No contact with [name] in 21 days"
  - CONTENT: "From weekly summary: [prompt type]"
- Display context in UI subtly (e.g., gray text below action description)
- Builds trust in automation and helps users understand system behavior

---

## User Experience

### No Manual Creation Button

**Rationale:**

- Manual creation adds cognitive load
- Users shouldn't need to think about "what action should I create?"
- System should be smart enough to generate everything

**User Flow:**

1. User interacts with app (adds lead, completes action, marks "Got a reply", etc.)
2. System automatically creates relevant actions (no prompts, no choices)
3. User sees actions in daily plan
4. User can:
   - Complete action ("Done - got reply" / "Done - no reply")
   - Snooze action (defer to later date)
   - Archive action (dismiss permanently)
   - Edit action (adjust due date, description) - if needed

**Edge Cases:**

- If user wants to create a custom action, they can:
  - Add it as a note on a lead (future: convert note to action)
  - Wait for system to auto-generate (it should be smart enough)

### Action Visibility

- **Daily Plan:** Shows actions due today (or overdue)
- **Actions Tab:** Shows all actions (NEW, SNOOZED, SENT, REPLIED)
- **Archived Actions:** Hidden from daily view (only in Insights)

---

## Metrics & Success Criteria

### Key Metrics

1. **Action Generation Rate:**

   - Target: 1-2 new actions per day per active lead
   - Measure: Actions created / Active leads

2. **Action Completion Rate:**

   - Target: >60% completion rate
   - Measure: Actions completed / Actions generated

3. **Revenue Impact:**

   - Track: Actions completed → Replies received → Calls booked
   - Goal: Improve conversion funnel

4. **User Engagement:**
   - Measure: Days active, actions completed per week
   - Goal: Increase with better auto-generation

### Success Criteria for v0.1

- ✅ All P0 action types auto-generate correctly
- ✅ No duplicate actions created
- ✅ Actions appear in daily plan within appropriate timeframe:
  - FOLLOW_UP: Immediately after "Got a reply"
  - POST_CALL: Within minutes of call ending
  - CALL_PREP: 24 hours before call (timezone-aware)
  - OUTREACH: Immediately when lead added
- ✅ User doesn't need to manually create actions
- ✅ System handles edge cases gracefully (archived leads, snoozed actions, inactive users, etc.)
- ✅ Action generation respects limits (max 15 pending, max 3 NURTURE per day)
- ✅ Stale actions auto-archive after 7 days of no interaction

---

## Future Enhancements (Post v0.1)

1. **User Preferences:**

   - Allow users to configure nurture intervals (14, 21, 30 days)
   - Toggle auto-generation on/off per action type
   - Customize follow-up timing (2-3 days vs 1 week)

2. **Smarter Detection:**

   - Full lead temperature system (hot/warm/cold/dead)
   - AI-based lead scoring (prioritize high-value leads)
   - Context-aware action descriptions
   - Predictive timing (best time to reach out)

3. **Event-Based Triggers:**

   - Calendar sync webhooks (real-time POST_CALL creation)
   - Email integration (auto-detect replies)
   - CRM sync triggers

4. **Action Suggestions Layer (Optional):**

   - For lower-urgency actions, show as "suggestions" first
   - User can click "Add to today" or "Not now"
   - Reduces noise while maintaining intelligence

5. **Manual Creation (If Needed):**

   - If user requests, add "Create Custom Action" button
   - But make it secondary to auto-generation

6. **Fast Win Auto-Selection:**
   - Enhance daily plan generator to always select Fast Win from candidates
   - Prioritize: FOLLOW_UP to recent reply > Simple NURTURE > Warm OUTREACH
   - Ensure Fast Win is first action every day

---

## Conclusion

**The Goal:** Create a system where actions flow naturally from user activity, requiring minimal cognitive load. Users should focus on _executing_ actions, not _creating_ them.

**The Strategy:** Auto-generate all actions based on triggers (leads added, replies received, calls scheduled, time elapsed). Users interact by completing, snoozing, or dismissing suggested actions.

**The Priority:** Implement P0 actions (OUTREACH ✅, FOLLOW_UP ⚠️, POST_CALL ❌) first, as these drive 90% of revenue. Then enhance with CALL_PREP and NURTURE. Finally, add CONTENT for engagement.

**The Result:** A frictionless system that keeps users engaged while driving revenue through intelligent, timely action generation.

---

## Appendix: Action Creation Decision Tree

```
START: Event/Trigger Occurs
│
├─ New Lead Added?
│  └─ YES → Create OUTREACH (due today)
│
├─ Action Marked "Got a Reply"?
│  └─ YES → Auto-create FOLLOW_UP (due 2-3 days, smart default)
│     └─ Show toast: "✓ Follow-up scheduled for [date]. [Adjust]"
│
├─ Calendar Event: Call in 24h?
│  └─ YES → Matches Lead? → No CALL_PREP exists?
│     └─ YES → Create CALL_PREP (due day before)
│
├─ Calendar Event: Call Ended?
│  └─ YES → Matches Lead? → No POST_CALL exists?
│     └─ YES → Create POST_CALL (due same/next day)
│
├─ Lead Not Contacted in 21+ Days?
│  └─ YES → Active Lead? → No NURTURE exists?
│     └─ YES → Create NURTURE (due today)
│
└─ Weekly Summary: Content Prompts Generated?
   └─ YES → User Completed ≥6 Actions?
      └─ YES → Convert Prompt to CONTENT Action
         ├─ Win post → Monday
         └─ Insight post → Wednesday
```
