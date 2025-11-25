# PRD vs Mockup Gap Analysis

## Overview
This document compares the Product Screenshot Mock Copy against the NextBestMove PRD v0.1 to identify gaps, inconsistencies, and missing features.

---

## ✅ COVERED FEATURES (Well-Aligned)

### 1. Daily Plan Screen
- ✅ Fast Win section present
- ✅ Action cards with proper buttons
- ✅ "Done - Got reply" / "Done - No reply yet" / "Snooze" options
- ✅ Header/subheader messaging aligned

### 2. Pin Management
- ✅ Pin list with name, URL type, date
- ✅ Snooze/Archive actions
- ✅ Empty state with CTA

### 3. Weekly Summary
- ✅ Metrics display (Active days, New conversations, Replies, Calls booked)
- ✅ Insight section
- ✅ Weekly Focus confirmation
- ✅ Content prompts

### 4. Onboarding Flow
- ✅ Welcome screen
- ✅ Pin first person
- ✅ Calendar connect (optional)
- ✅ Weekly focus setup
- ✅ First daily plan ready

---

## 🟡 GAPS & MISSING FEATURES

### 1. Daily Plan Screen

#### Missing Action Types
**PRD Specifies:** (Section 10.1)
- OUTREACH
- FOLLOW_UP ✅ (shown)
- NURTURE ✅ (shown)
- CALL_PREP ❌ (not shown)
- POST_CALL ❌ (not shown)
- CONTENT ❌ (not shown)
- FAST_WIN ✅ (shown as separate section)

**Gap:** Mockups only show 3 action types (Follow-Up, New Outreach, Nurture). Missing CALL_PREP, POST_CALL, and CONTENT action cards.

#### Missing Elements
- **"Today's focus" line** (PRD Section 12 mentions this as user-facing)
- **Action count indicator** (e.g., "3 of 6 actions completed")
- **Link to pinned person** - PRD specifies actions link to PersonPin, but mockups don't show clickable links to person profiles
- **Optional notes on actions** - PRD Section 7.1 mentions users can add notes like "asked to talk in March", but no UI shown

#### Action State Handling
- Mockup shows "Done - Got reply" and "Done - No reply yet" ✅
- **Missing:** What happens when action is in SENT state and user wants to mark reply later (PRD Section 10.3: SENT → REPLIED transition)
- **Missing:** ARCHIVED state handling (though this may be implicit)

---

### 2. Pin Management Screen

#### Missing Features
- **Notes display** - PRD allows optional notes per pin, but mockup doesn't show where notes appear in the list
- **Status indicator** - PRD has ACTIVE/SNOOZED/ARCHIVED states, but mockups don't clearly show which pins are SNOOZED vs ACTIVE
- **Edit Pin functionality** - No way to edit pin name, URL, or notes shown
- **Filter/View toggle** - No way to filter by ACTIVE/SNOOZED/ARCHIVED status

#### Inconsistency
- Mockup shows "Added 3 days ago" but PRD doesn't specify showing pin creation dates in list view

---

### 3. Add Person Modal

#### Missing
- **URL validation/help text** - PRD mentions LinkedIn, CRM, or mailto links, but mockup doesn't guide users on format
- **Notes field** - PRD specifies optional notes, but mockup doesn't show this field (it's mentioned in text but not visible in modal)

#### Clarification Needed
- How does user distinguish between LinkedIn profile URL vs CRM record URL vs email?

---

### 4. Follow-Up Flow

#### Alignment ✅
- "Got a reply — what's next?" modal matches PRD Section 10.4
- Options: Schedule follow-up / Snooze / Mark complete ✅

#### Missing Elements
- **System-suggested date** - PRD says "System suggests a date (2–3 days out)" but mockup shows generic options (2 days, 3 days, Next week, Pick a date) without highlighting the recommendation
- **Notes prompt** - PRD mentions user can add notes like "asked to talk in March" but no place to capture this in the follow-up scheduling flow

---

### 5. Weekly Summary Screen

#### Missing Metrics
**PRD Specifies:** (Section 8.1)
- Days active ✅
- Actions completed ✅ (shown as "New conversations: 6" but not total actions)
- Replies ✅
- Calls booked ✅
- **Streak count** ❌ (not shown - PRD mentions streak in Section 16 User model)

#### Missing Elements
- **Narrative summary** - PRD Section 8.1 says "2–3 sentence narrative summary" but mockup only shows metrics and insight
- **Content prompt interaction** - Mockup shows prompts but no "Save to Content ideas" or "Copy" buttons mentioned in PRD Section 15.2
- **"Deals progressed" metric** - Mockup shows this but PRD doesn't explicitly mention tracking deals in metrics

#### Clarification Needed
- Mockup shows "New conversations: 6" but PRD tracks "actions completed" - need to clarify if this is the same or different

---

### 6. Onboarding Screens

#### Missing Step
**PRD Section 13.1 specifies:**
1. Welcome ✅
2. Pin first person ✅
3. Connect calendar ✅
4. Weekly Focus ✅
5. First daily plan ✅
6. **Complete Fast Win** ❌ - PRD says "Guide user through executing the Fast Win" but mockup doesn't show this interactive step

#### Onboarding Success Criteria
- PRD Section 13.2 mentions success gates but no explicit "progress indicator" or "X of Y steps completed" shown in mockups

---

### 7. Recovery Flows

#### Coverage ✅
- "Light day today" banner for missed days ✅
- "Welcome back" for 7+ days inactive ✅

#### Missing Scenarios
**PRD Section 14 specifies:**
- **Low Completion (3 Days <50%)** - Mockup shows "Light day today" but doesn't match the specific PRD message: "Let's ease back in — here are your 3 highest-impact moves for today."
- **High Completion celebration** - PRD Section 14.3 mentions "You're on a roll. Want to try 1–2 extra actions tomorrow?" but no mockup for this positive reinforcement flow
- **"Restart" option** - Mockup mentions "Restart" but PRD doesn't define what this means or what data it clears

---

### 8. Notifications

#### Coverage ✅
- Morning Plan ✅
- Fast Win ✅
- Follow-Up Due ✅
- Weekly Summary ✅
- Missed Day ✅

#### Missing Context
- **Notification timing** - PRD doesn't specify when notifications are sent (e.g., what time for "Morning Plan"?)
- **Notification preferences** - No settings UI shown for managing notification types

---

### 9. Settings Screen

#### Missing Settings
**PRD mentions but mockup doesn't show:**
- **Timezone** - PRD Section 16 User model includes timezone but no setting for it
- **Streak count display** - User model tracks streak_count but no way to view it
- **Weekly summary timing** - PRD says "delivered Sunday night / Monday morning" but no preference setting

#### Settings Shown But Not in PRD
- **Daily Capacity: Light / Standard / Full** - This conflicts with PRD! 
  - PRD Section 11.1 says: "If no calendar connected → defaults to 5–6 actions/day, with a manual 'Busy today' / 'Light day' override planned for v0.2."
  - PRD Section 20 (MVP Scope) says this is **Deferred to v0.2+**
  - **⚠️ CRITICAL GAP:** Mockup includes v0.2 feature in Settings

#### Calendar Setting
- ✅ Calendar connection status shown
- ✅ Description text: "Used to size your daily plan"

#### Content Prompts Toggle
- ✅ On/Off toggle shown
- ⚠️ **Not explicitly mentioned in PRD** - PRD Section 15.1 says prompts are generated "if user completed ≥ 6 actions that week" but doesn't mention an opt-out toggle

#### Data Export
- ✅ JSON export mentioned (matches PRD Section 18)

---

## 🔴 CRITICAL DISCREPANCIES

### 1. Daily Capacity Override (Settings)
**Status:** ⚠️ **VERSION MISMATCH**
- **PRD:** Deferred to v0.2 (Section 20: "Deferred (v0.2+): Manual 'Busy today' / 'Light day' override")
- **Mockup:** Shows "Daily Capacity: Light · Standard · Full" in Settings
- **Impact:** This is a major feature that shouldn't be in v0.1 according to PRD

### 2. Content Prompts Toggle
**Status:** 🟡 **NEEDS CLARIFICATION**
- **PRD:** Doesn't mention opt-out toggle, only conditional generation (≥ 6 actions/week)
- **Mockup:** Shows On/Off toggle
- **Decision Needed:** Is this v0.1 or should it follow PRD logic only?

---

## 🟠 MINOR GAPS / UX ENHANCEMENTS NEEDED

### 1. Action Details
- No way to see **why** an action was suggested (though PRD Section 19 says "Why this action?" explanation is not in v0.1, so this is intentional)
- No way to view/edit **notes on actions** after creation
- No link to open the **pinned person's URL** from action card

### 2. Pin Management
- No bulk actions (snooze multiple, archive multiple)
- No search/filter for pins
- No indication of which pins have upcoming actions

### 3. Weekly Summary
- No way to view **previous weekly summaries** (history)
- No way to **regenerate** or edit the suggested Weekly Focus after confirming
- Content prompts are static - no "expand to see full draft" or editing UI

### 4. Calendar Integration
- No way to see **how calendar is being used** to determine capacity (transparency)
- No indication of calendar connection issues

### 5. Empty States
- Missing empty state for Daily Plan when no actions available
- Missing empty state for Weekly Summary if user hasn't completed any actions

---

## 📝 TERMINOLOGY INCONSISTENCIES

### 1. "New Outreach" vs "OUTREACH"
- Mockup uses "New Outreach" label
- PRD uses "OUTREACH" as action type
- **Recommendation:** Standardize on action type naming

### 2. "New conversations" vs "Actions completed"
- Weekly Summary mockup shows "New conversations: 6"
- PRD tracks "actions completed" as broader metric
- **Clarification Needed:** Are these the same? PRD mentions OUTREACH actions but also tracks all action types

### 3. "Deals progressed"
- Mockup shows this metric
- PRD doesn't explicitly track "deals" as a concept
- **Clarification Needed:** Is this derived from actions? What defines a "deal progressed"?

---

## 🎯 ACTION ITEMS

### High Priority (v0.1 Blockers)
1. **Remove Daily Capacity override from Settings** (it's v0.2 per PRD)
2. **Add missing action types:** CALL_PREP, POST_CALL, CONTENT action card examples
3. **Add notes field to Add Person Modal** (PRD allows optional notes)
4. **Add "Complete Fast Win" onboarding step** with guided interaction
5. **Clarify Content Prompts toggle** - is opt-out allowed in v0.1?

### Medium Priority (UX Gaps)
6. **Add notes display** in Pin Management (if notes exist)
7. **Add status indicators** for SNOOZED pins in list
8. **Show narrative summary** in Weekly Summary (PRD specifies 2-3 sentences)
9. **Add content prompt interaction** (Save/Copy buttons per PRD Section 15.2)
10. **Add streak count display** somewhere in UI
11. **Add high completion celebration** flow (Section 14.3)

### Low Priority (Nice to Have)
12. Add "Today's focus" line to Daily Plan
13. Add action completion progress indicator
14. Add links to pinned person profiles from actions
15. Add URL format help text in Add Person Modal
16. Add previous weekly summaries view

---

## ✅ SUMMARY

**Overall Alignment:** ~85%

**Critical Issues:** 1 (Daily Capacity override is v0.2 feature)

**Missing Features:** ~10-15 items (mostly optional enhancements, a few core features like CALL_PREP/POST_CALL action types)

**Recommendation:** 
- Remove Daily Capacity override from Settings mockup
- Add examples of all 7 action types to Daily Plan mockup
- Add missing onboarding step (Complete Fast Win)
- Clarify content prompts toggle decision

---

*Analysis completed: Comparing PRD v0.1 vs Product Screenshot Mock Copy*

