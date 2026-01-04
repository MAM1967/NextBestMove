# Actions Tab — Relationship-Linked Action Queue (Refined PRD)

**Product:** NextBestMove  
**Owner:** Michael McDermott  
**Status:** Ready for implementation  
**Scope:** Actions tab + unified action design across Today, Daily Plan, and Actions pages  
**Last Updated:** January 2025

---

## 1. Problem Statement

Users need a fast, low-friction way to process follow-ups and next steps in the context of relationships, not as isolated tasks.

**Current Issues:**
- Actions are manually created, increasing cognitive load
- Actions lack clear source attribution (email, meeting notes, etc.)
- Action status model doesn't clearly reflect user intent
- Different action card designs across pages create confusion

**Solution:**
- System-created actions from signals (emails, meeting notes, calendar events)
- Unified action card design across all pages
- Clear source attribution and intent tracking
- Simplified status model that maps to existing states
- Fast triage without opening detail views

---

## 2. Design Principles (Non-Negotiable)

1. **Relationship-First (with Flexibility)**
   - Most actions are linked to a relationship (required for FOLLOW_UP, OUTREACH, CALL_PREP, POST_CALL)
   - Some actions may be relationship-optional (CONTENT, general NURTURE, general business tasks)
   - Relationship context is always visible when present
   - General business actions (e.g., "Create LinkedIn post") don't require a relationship

2. **System-Created, User-Activated**
   - Actions are primarily created from signals (emails, notes, calendar)
   - Users activate and complete actions, not create them from scratch
   - Manual creation is available but secondary

3. **Intent over Mechanics**
   - Status reflects user intent (acknowledged, deferred, completed)
   - Not generic task completion semantics
   - Clear mapping to existing state machine

4. **Fast Triage**
   - Most actions should be processed without opening detail views
   - One-click status changes
   - Optimistic UI updates

5. **Unified Design**
   - Same action card component across Today, Daily Plan, and Actions pages
   - Consistent visual hierarchy and interactions
   - No cognitive load from design differences

6. **Two Mental Models, One System**
   - "What's due today?" (Due View)
   - "Who do I need to work?" (Relationships View)

---

## 3. Primary User Goals

- See what needs attention today
- Quickly mark progress without losing context
- Group work by relationship when desired
- Avoid cognitive overload or task sprawl
- Understand where actions came from (email, meeting, etc.)

---

## 4. Action Data Model (Enhanced)

### 4.1 Core Fields (Existing)

```typescript
Action {
  id: UUID
  user_id: UUID
  lead_id: UUID?             // Required for FOLLOW_UP, OUTREACH, CALL_PREP, POST_CALL; Optional for CONTENT, general NURTURE
  action_type: ActionType    // OUTREACH, FOLLOW_UP, NURTURE, CALL_PREP, POST_CALL, CONTENT, FAST_WIN
  state: ActionState          // NEW, SENT, REPLIED, SNOOZED, DONE, ARCHIVED
  description: TEXT          // Verb-led title (e.g., "Follow up on Q1 plan")
  due_date: DATE
  completed_at: TIMESTAMPTZ?
  snooze_until: DATE?
  notes: TEXT?
  auto_created: BOOLEAN      // true if system-created from signals
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
}
```

### 4.1.1 Relationship Requirements by Action Type

**Relationship-Required (lead_id NOT NULL):**
- FOLLOW_UP — must be with someone
- OUTREACH — must be to someone
- CALL_PREP — must be for a call with someone
- POST_CALL — must be after a call with someone
- Most NURTURE actions — usually person-specific

**Relationship-Optional (lead_id nullable):**
- CONTENT — LinkedIn posts, articles, blog posts (general business activity)
- Some NURTURE actions — general nurturing (e.g., "Share industry insights on LinkedIn")
- General business tasks — not person-specific

### 4.2 New Fields (To Add)

```typescript
// Source attribution
source: 'email' | 'linkedin' | 'calendar' | 'meeting_note' | 'manual' | 'system'
source_ref: TEXT?            // Reference to source (e.g., email_id, meeting_note_id)

// Intent classification (complementary to action_type)
intent_type: 'follow_up' | 'reply' | 'schedule' | 'review' | 'outreach' | 'nurture' | null

// Status mapping (derived/computed, not stored)
// Maps to existing states:
//   Pending → NEW
//   Waiting → SENT (done, no reply yet - more satisfying than "Acknowledged")
//   Snoozed → SNOOZED (keep current language, not "Deferred")
//   Done → DONE or REPLIED (mentally satisfying, not "Completed")
```

### 4.3 Status Model Mapping

**New PRD Status → Existing State:**
- **Pending** → `state = NEW` (not yet addressed)
- **Waiting** → `state = SENT` (done, waiting for reply - more satisfying than "Acknowledged")
- **Snoozed** → `state = SNOOZED` (intentionally postponed - keep current language, not "Deferred")
- **Done** → `state = DONE` or `REPLIED` (action fully done - mentally satisfying, not "Completed")

**Note:** We keep the existing state machine but add a "status" concept in the UI that maps to states. This provides user-friendly language while maintaining backward compatibility.

---

## 5. System-Created Actions

### 5.1 Action Creation Sources

**Email Signals:**
- AI extracts recommended actions from email content
- Creates FOLLOW_UP actions with `source = 'email'`, `source_ref = email_id`
- Sets `intent_type` based on email analysis (follow_up, reply, schedule, review)
- Links to relationship via email address matching

**Meeting Notes:**
- User adds meeting notes to relationship
- AI extracts action items from notes
- Creates actions with `source = 'meeting_note'`, `source_ref = meeting_note_id`
- Sets appropriate `action_type` and `intent_type`

**Calendar Events:**
- Upcoming calls/meetings create CALL_PREP actions
- Past calls/meetings create POST_CALL actions
- `source = 'calendar'`, `source_ref = calendar_event_id`

**LinkedIn Signals (Future):**
- LinkedIn messages create OUTREACH or FOLLOW_UP actions
- `source = 'linkedin'`, `source_ref = message_id`

**Manual Creation:**
- User can manually create actions
- `source = 'manual'`, `auto_created = false`

**System-Generated:**
- Decision engine creates actions based on cadence
- `source = 'system'`, `auto_created = true`

### 5.2 Action Creation Rules

1. **Link to relationship when applicable** - Most actions require a relationship, but CONTENT and general business tasks may be relationship-optional
2. **Set source and source_ref** - Track where action came from
3. **Set intent_type** - Classify the intent (complementary to action_type)
4. **Set auto_created = true** - For system-created actions
5. **Smart scheduling** - Use `scheduleMultipleActions` to space actions (max 2 per relationship per day, only applies to relationship-linked actions)
6. **Relationship validation** - Enforce relationship requirement based on action_type:
   - FOLLOW_UP, OUTREACH, CALL_PREP, POST_CALL → require lead_id
   - CONTENT, general NURTURE → lead_id optional

---

## 6. Actions Page Architecture

### 6.1 Route
`/app/actions`

### 6.2 Top-Level Components
- `ActionsPage` - Main page component
- `ActionsFilterBar` - Sticky filter bar
- `ActionsList` - List of actions (Due or Relationships view)
- `UnifiedActionCard` - Single action card (shared component)
- `RelationshipGroupHeader` - Header for relationship groups
- `SectionHeader` - Header for due date sections
- `EmptyState` - Empty state component

---

## 7. Actions Page Layout

### 7.1 Header
- **Title:** Actions
- **Helper text (desktop only):** "Process follow-ups and keep relationships moving."

### 7.2 Filter Bar (ActionsFilterBar)

**Sticky. Single row.**

Components:
1. **ViewToggle** - Segmented control
   - Options: "Due" (default) | "Relationships"
   
2. **RelationshipFilter** - Search-select
   - Default: "All relationships"
   - Searchable dropdown of relationships
   
3. **DueFilter** - Dropdown (shown in Due view)
   - Options: "Overdue" | "Today" | "Next 7 days" | "This month" | "None" | "All"
   - Default: Implicit grouping (no narrowing)
   
4. **StatusFilter** - Multi-select
   - Options: "Pending" | "Waiting" | "Snoozed" | "Done"
   - Default: "Pending" + "Waiting"
   - Maps to states: Pending (NEW), Waiting (SENT), Snoozed (SNOOZED), Done (DONE/REPLIED)
   - Uses satisfying, less formal language for psychological satisfaction
   
5. **SourceFilter** - Multi-select (overflow menu)
   - Options: "Email" | "LinkedIn" | "Calendar" | "Meeting Note" | "Manual" | "System"
   
6. **IntentFilter** - Multi-select (overflow menu)
   - Options: "Follow-up" | "Reply" | "Schedule" | "Review" | "Outreach" | "Nurture"

---

## 8. Views

### 8.1 Due View (Default)

**Purpose:** "What should I work on now?"

**Grouping (in order):**
1. Overdue
2. Today
3. Upcoming (next 7 days)
4. Later (beyond 7 days)
5. No due date

Within each group, relationship-linked actions appear first, then general business actions (if any).

**Sorting within group:**
1. Relationship-linked actions: Due date (earliest first), then created date (newest first)
2. General business actions: Due date (earliest first), then created date (newest first)

**Components:**
- `SectionHeader` - "Overdue", "Today", etc.
- `UnifiedActionCard` - Full-width action cards

**Sections only render if they contain items**, unless explicitly filtered.

### 8.2 Relationships View

**Purpose:** "Who do I need to work?"

**Grouping:**
- By relationship (only relationship-linked actions shown)
- General business actions (CONTENT, general NURTURE without relationship) appear in a separate "General Business" section at the bottom

**Sorting of groups:**
1. Earliest due action in group
2. Relationship status (Needs attention first)

**Components:**
- `RelationshipGroupHeader` - Shows relationship name, tier, next touch due
- `UnifiedActionCard` - Relationship anchor suppressed (name not shown in card)
- `SectionHeader` - "General Business" section for relationship-optional actions

**Behavior:**
- Show max 3 actions per relationship
- "View all actions" link expands inline or navigates to relationship-scoped list
- General business actions grouped separately (not by relationship)

---

## 9. Unified Action Card Specification

**Component:** `UnifiedActionCard` (shared across Today, Daily Plan, Actions pages)

### 9.1 Visual Hierarchy

**Line 1 – Title**
- 1 line, truncated
- Verb-led
- Example: "Follow up on Q1 plan"

**Line 2 – Relationship Anchor** (hidden in Relationships View, shown only if lead_id exists)
- Name + role/company (if available)
- Example: "Mike O'Brien · Fractional CMO"
- Clickable link to relationship detail
- If no relationship: Show "General Business" or "Content" badge instead

**Meta Row**
- **Left:** Source icon + label (Email, Meeting Note, Calendar, etc.)
- **Right:** Due indicator
  - "Overdue 3d"
  - "Due today"
  - "Due Tue, Jan 7"
  - "No due date"

**Status Controls**
- Pill buttons (mutually exclusive):
  - **Done** (maps to DONE or REPLIED) - mentally satisfying
  - For FOLLOW_UP: **"Done - Got reply"** and **"Done - No reply yet"** (keep current, already good)
  - For other actions: **"Done, waiting"** (maps to SENT - concise, satisfying alternative to "Waiting on Reply")
  - **Snooze** (maps to SNOOZED) - keep current, satisfying (not "Defer")

**Priority Indicator**
- Left border color:
  - Red: overdue
  - Yellow: due today / next 48h
  - Gray: normal

**Source Badge**
- Small badge showing source (Email, Meeting Note, Calendar, etc.)
- Color-coded by source type

### 9.2 Interactions

- **Tap card body** → ActionDetailDrawer (optional, for details)
- **Tap status pill** → Instant optimistic update
- **Done actions** → Fade and collapse (unless "Show done" enabled)

### 9.3 Status Button Behavior

**Pending (NEW state):**
- Show: "Done", "Done, waiting" (or "Done - No reply yet" for FOLLOW_UP), "Snooze"
- "Done" → DONE or REPLIED (based on action type)
- "Done, waiting" → SENT (or "Done - No reply yet" for FOLLOW_UP actions)
- "Snooze" → SNOOZED (opens snooze modal)

**Waiting (SENT state):**
- Show: "Got reply" (if FOLLOW_UP), "Done", "Snooze"
- "Got reply" → REPLIED (triggers follow-up flow)

**Snoozed (SNOOZED state):**
- Show: "Activate" (returns to NEW), "Done", "Archive"

**Done (DONE/REPLIED state):**
- Show: "Add note" only
- Card is faded/collapsed

---

## 10. Empty States

### 10.1 Global Empty
- **Title:** No actions yet
- **Body:** Actions appear when you capture a follow-up or a signal creates one.
- **CTA:** Create action

### 10.2 Filtered Empty
- **Title:** No matching actions
- **Body:** Try clearing filters or switching views.
- **CTAs:** Clear filters · Switch view

### 10.3 Due-Specific Empty
- Examples:
  - "No overdue actions. You're caught up."
  - "Nothing due today. Work by relationship?"

### 10.4 Relationships View Empty
- **No relationships:**
  - CTA: Add relationship
- **Relationships exist, no relationship-linked actions:**
  - Message: "No open actions for relationships."
  - Note: General business actions (if any) still appear in "General Business" section

---

## 11. Integration with Existing Pages

### 11.1 Today Page
- Uses `UnifiedActionCard` for "Best Action"
- Shows relationship context
- Same visual design as Actions page

### 11.2 Daily Plan Page
- Uses `UnifiedActionCard` for all actions (Fast Win + regular)
- Full-width cards
- Same visual design as Actions page

### 11.3 Actions Page
- Primary location for action management
- Due View and Relationships View
- Full filtering and sorting capabilities

**Key Principle:** All three pages use the exact same `UnifiedActionCard` component with identical styling and behavior.

---

## 12. Analytics & Event Tracking

### 12.1 Page Events
- `actions_page_viewed` - properties: viewType

### 12.2 Filter Events
- `actions_view_toggled` - fromView, toView
- `actions_filter_applied` - filterType, filterValue

### 12.3 Action Events
- `action_card_clicked` - actionId, relationshipId
- `action_status_changed` - actionId, previousStatus, newStatus, source, dueBucket

### 12.4 Empty State Events
- `actions_empty_state_viewed` - type (global | filtered | due | relationship)
- `actions_empty_cta_clicked` - ctaType

---

## 13. Non-Goals (Explicit)
- No standalone task management
- No manual priority setting (v1) - priority comes from decision engine
- No bulk edit (v1)
- No action templates (v1) - actions are created from signals

---

## 14. Success Criteria
- User can process actions without opening details
- Most actions feel connected to people (relationship-first)
- General business actions (CONTENT, etc.) are clearly distinguished but integrated
- Due View and Relationship View feel like two lenses on the same system
- No "misc task list" behavior emerges
- Unified design reduces cognitive load
- System-created actions reduce manual work

---

## 15. Migration Strategy

### 15.1 Database Migration
1. Add `source` column (enum: email, linkedin, calendar, meeting_note, manual, system)
2. Add `source_ref` column (TEXT, nullable)
3. Add `intent_type` column (enum: follow_up, reply, schedule, review, outreach, nurture, nullable)
4. **Keep `lead_id` nullable** - Allow relationship-optional actions (CONTENT, general business tasks)
5. Add application-level validation:
   - Enforce `lead_id` NOT NULL for FOLLOW_UP, OUTREACH, CALL_PREP, POST_CALL
   - Allow `lead_id` NULL for CONTENT and general NURTURE
6. Backfill existing actions:
   - `auto_created = true` → `source = 'system'`
   - `auto_created = false` → `source = 'manual'`

### 15.2 UI Migration
1. Update `UnifiedActionCard` to show source badge
2. Add status filter mapping (Pending/Waiting/Snoozed/Done → states)
   - Uses satisfying language: "Waiting" (not "Acknowledged"), "Snoozed" (not "Deferred"), "Done" (not "Completed")
3. Implement Actions page with Due and Relationships views
4. Ensure Today and Daily Plan pages use same `UnifiedActionCard`

### 15.3 Action Creation Updates
1. Update email signal ingestion to set `source = 'email'`, `source_ref = email_id`
2. Update meeting notes processing to create actions with `source = 'meeting_note'`
3. Update calendar integration to create actions with `source = 'calendar'`
4. Update decision engine to set `source = 'system'` for auto-created actions

---

## 16. Open Questions / Future Enhancements

- Action generation from signals (already in progress)
- Relationship timeline view (future)
- Weekly review mode (future)
- AI-suggested next action (future)
- Action templates (future)

---

**End of Actions PRD (Refined)**

