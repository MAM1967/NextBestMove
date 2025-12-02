# Weekly Focus Display - Refined Implementation Plan

**Date:** January 2025  
**Status:** 📋 Ready for Implementation  
**Priority:** P1 - High Value

---

## Critique of Original Plan

### ✅ **Strengths**
1. **Excellent UX thinking** - Avoiding staleness is critical
2. **Context-aware approach** - Messages should reflect user state
3. **Comprehensive categories** - Good coverage of scenarios
4. **Quality control** - Human review and metrics tracking

### ⚠️ **Concerns & Refinements**

#### 1. **Complexity vs. Value (v0.1)**
- **Issue:** 100+ messages, 14-day deduplication, synonym rotation = 20-30 hours
- **Reality:** We need to ship value quickly, not perfect system
- **Solution:** Phased approach - Start simple, iterate based on data

#### 2. **Integration with Existing System**
- **Issue:** Plan doesn't address how this integrates with adaptive recovery messages
- **Reality:** We already have `focus_statement` in `daily_plans` for adaptive recovery
- **Solution:** Clear priority hierarchy: Adaptive Recovery > Weekly Focus > Dynamic Messages

#### 3. **Weekly Focus Not Prioritized**
- **Issue:** `next_week_focus` from `weekly_summaries` is mentioned but not central
- **Reality:** This is the actual backlog item - fetch and display weekly focus
- **Solution:** Make weekly focus the foundation, then enhance with dynamic messages

#### 4. **Missing Data Requirements**
- **Issue:** Many context variables require new queries/tracking
- **Reality:** We need to work with what we have first
- **Solution:** Start with available data, add tracking incrementally

---

## Refined Phased Approach

### **Phase 1: v0.1 - Foundation (2-3 hours)**
**Goal:** Display `next_week_focus` from `weekly_summaries` table

**Implementation:**
1. ✅ Fetch `next_week_focus` from most recent `weekly_summaries` entry
2. ✅ Display when no adaptive recovery message exists
3. ✅ Fallback to placeholder if no weekly summary exists
4. ✅ Update priority: `adaptive_recovery > weekly_focus > placeholder`

**Files to modify:**
- `web/src/app/app/plan/page.tsx` - Update `fetchWeeklyFocus()` to query database
- `web/src/app/api/weekly-summaries/route.ts` - Add endpoint or use existing

**Acceptance Criteria:**
- ✅ Weekly focus displays when available
- ✅ Adaptive recovery messages take priority (as they should)
- ✅ Graceful fallback when no weekly summary exists
- ✅ Works for new users (no weekly summary yet)

**Why this first:** This is the actual backlog item. It's quick, high-value, and unblocks the dynamic system.

---

### **Phase 2: v0.2 - Context-Aware Enhancement (1-2 days)**
**Goal:** Add simple context-aware messages when no weekly focus exists

**Implementation:**
1. ✅ Create message library (20-30 messages across 5-6 categories)
2. ✅ Simple context detection:
   - Day of week (Monday, Friday)
   - Capacity level (micro, light, heavy)
   - Streak status (high streak, returning after absence)
   - Recent completion (yesterday completed/skipped)
3. ✅ Basic rotation (7-day deduplication, not 14)
4. ✅ Store shown messages in `daily_plans.focus_statement` when generated

**Message Categories (Simplified):**
1. **Monday Fresh Start** (3-4 messages)
2. **Friday Wind-Down** (3-4 messages)
3. **High Streak** (3-4 messages)
4. **Returning After Absence** (3-4 messages)
5. **Low Capacity Day** (3-4 messages)
6. **High Capacity Day** (3-4 messages)

**Files to create/modify:**
- `web/src/lib/plans/focus-messages.ts` - Message library and selection logic
- `web/src/lib/plans/generate-daily-plan.ts` - Generate focus message when no weekly focus
- Database: Track shown messages (use `daily_plans.focus_statement` or new table)

**Acceptance Criteria:**
- ✅ Messages feel personal and relevant
- ✅ No repeats within 7 days
- ✅ Adaptive recovery still takes priority
- ✅ Weekly focus takes priority over dynamic messages

**Why this second:** Adds value without over-engineering. We can measure engagement before building the full system.

---

### **Phase 3: v0.3 - Full Dynamic System (1 week)**
**Goal:** Implement the full dynamic motivation system from original plan

**Implementation:**
1. ✅ Expand message library to 100+ messages
2. ✅ Add all 10 categories from original plan
3. ✅ Implement 14-day deduplication
4. ✅ Add synonym rotation
5. ✅ Add pipeline context (pending replies, stalled conversations)
6. ✅ Add analytics tracking
7. ✅ A/B test message categories

**Why this third:** Only if Phase 2 shows strong engagement. Data-driven decision.

---

## Priority Hierarchy (Critical)

```
1. Adaptive Recovery Messages (highest priority)
   - "Welcome back. One small win to restart your momentum."
   - "Let's ease back in — here are your highest-impact moves for today."
   - "You're on a roll! Here's your plan for today."

2. Weekly Focus (from weekly_summaries.next_week_focus)
   - "Re-engage warm threads and book 1 new call."
   - User-set weekly goal

3. Dynamic Context Messages (when no weekly focus)
   - Monday fresh start
   - Friday wind-down
   - High streak
   - etc.

4. Placeholder (fallback)
   - "Build consistent revenue rhythm"
```

**Rationale:** Adaptive recovery is time-sensitive and contextual. Weekly focus is user-set and important. Dynamic messages are nice-to-have.

---

## Implementation: Phase 1 (v0.1)

### Step 1: Create API Endpoint (if needed)

Check if we can fetch from existing endpoint or need new one:

```typescript
// web/src/app/api/weekly-summaries/route.ts
// Should already exist - check if it returns next_week_focus
```

### Step 2: Update fetchWeeklyFocus()

```typescript
const fetchWeeklyFocus = async () => {
  try {
    // Get current week's Monday
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    
    const weekStart = monday.toISOString().split('T')[0];
    
    // Fetch most recent weekly summary
    const response = await fetch(`/api/weekly-summaries?week_start=${weekStart}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data?.next_week_focus) {
        setWeeklyFocus(data.next_week_focus);
        return;
      }
    }
    
    // Fallback: Get most recent weekly summary (any week)
    const recentResponse = await fetch('/api/weekly-summaries?recent=true');
    if (recentResponse.ok) {
      const recentData = await recentResponse.json();
      if (recentData?.next_week_focus) {
        setWeeklyFocus(recentData.next_week_focus);
        return;
      }
    }
    
    // Final fallback: placeholder
    setWeeklyFocus("Build consistent revenue rhythm");
  } catch (err) {
    console.error("Failed to fetch weekly focus:", err);
    setWeeklyFocus("Build consistent revenue rhythm");
  }
};
```

### Step 3: Verify Priority Logic

Current code already has correct priority:
```typescript
{dailyPlan?.focus_statement || weeklyFocus}
```

This means:
- If adaptive recovery message exists → show it
- Else if weekly focus exists → show it
- Else → show nothing (which is fine)

---

## Success Metrics (Phase 2+)

Track these once dynamic messages are added:

1. **Engagement Rate:** User views daily plan within 5 min of opening app
2. **Completion Rate:** Actions completed on days with different message types
3. **Message Effectiveness:** Which categories drive highest completion rates
4. **Staleness Detection:** User skips reading focus message (track scroll/click)

---

## Recommendations

### ✅ **Do First (Phase 1)**
- Fetch and display `next_week_focus` from database
- This is the actual backlog item
- Quick win, high value
- Unblocks future enhancements

### ⏱ **Do Second (Phase 2) - If Phase 1 Shows Value**
- Add 20-30 context-aware messages
- Simple 7-day rotation
- Measure engagement before expanding

### 🔮 **Do Third (Phase 3) - If Data Supports It**
- Full dynamic system with 100+ messages
- 14-day deduplication
- Synonym rotation
- Pipeline context
- A/B testing

---

## Final Verdict

**Your original plan is excellent** - but it's a v0.3 feature, not v0.1.

**Start simple:**
1. ✅ Display `next_week_focus` (2-3 hours)
2. ⏱ Add 20-30 context messages (1-2 days)
3. 🔮 Build full system if data shows value (1 week)

**The key insight:** We need to measure engagement before investing 20-30 hours. Phase 1 gives us the foundation and lets us validate the concept.

---

_This plan balances ambition with pragmatism. Ship value, measure, iterate._

