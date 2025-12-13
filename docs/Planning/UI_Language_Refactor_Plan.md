# UI Language Refactor: From CRM to "Do the Work" Language

**Status:** 📋 Ready for Implementation  
**Priority:** 🔴 P1 (Critical - Beta user feedback)  
**Estimated Time:** 3-5 days (user-facing language only)

---

## Overview

Refactor product language across the app (screens, onboarding, microcopy, emails/notifications) so NextBestMove does not feel like a CRM, and the experience aligns with how users talk about their work. This is driven by interviews showing language is a primary differentiator and "CRM-sounding" terminology creates misalignment.

**Scope:** User-facing language only. No changes to API endpoints, database schema, or internal code structure.

**Reference:** Similar in scope to the pins-to-leads refactor (see `docs/Planning/Pins_To_Leads_Refactoring_Plan.md`), but focused exclusively on UI copy and user-facing strings.

---

## New Navigation Labels (Locked)

The navigation bar will use these labels:

- **Today** (replaces "Dashboard")
- **Relationships** (replaces "Leads")
- **Daily Plan** (unchanged)
- **Actions** (unchanged)
- **Weekly Review** (replaces "Weekly Summary" - simple rename, no content merge)
- **Content Ideas** (unchanged - remains in navigation)
- **Signals** (new - reserved for external/contextual events that may warrant new actions)
- **Settings** (unchanged)

**Key Changes:**
- "Weekly Summary" → "Weekly Review" (simple rename for P1)
- "Insights" remains in navigation for now (content merge moved to P2 - high priority)
- "Signals" is a new section for external/contextual events (upstream discovery)
- "Content Ideas" remains unchanged

**Note:** Insights screen content merge into Weekly Review is deferred to P2 (high priority) to keep P1 scope focused on language changes only.

---

## Part 1: User-Facing Language Refactor (P1 - Do Today)

### Goal

Update all user-facing strings to align with the new navigation language and eliminate CRM terminology. This includes:
- Navigation labels
- Page titles and headers
- Button labels, empty states, tooltips
- Onboarding copy
- System messages, toasts, error states
- Email templates and notification copy

### Non-Goals

- No changes to API endpoint names (e.g., `/api/leads` stays as-is)
- No changes to database schema or table names
- No changes to TypeScript types or variable names
- No changes to internal code structure

---

## Phase 1: Establish Language System (Day 1)

### 1.1 Create Glossary + Forbidden Terms List

**Deliverable:** `docs/Planning/UI_Language_Glossary.md`

**Approved Terms:**
- Today (not Dashboard)
- Relationships (not Leads, Contacts, Network)
- Daily Plan (unchanged)
- Actions (unchanged)
- Weekly Review (not Weekly Summary, not Insights)
- Content Ideas (unchanged)
- Signals (new - for external/contextual events, not Insights, News, Intel, Triggers)
- Settings (unchanged)

**Deferred Terms:**
- Insights (remains in navigation for P1, content merge to Weekly Review moved to P2 - high priority)

**Forbidden Terms (Avoid CRM Language):**
- pipeline
- lead stages
- prospects
- opportunities
- deal flow
- CRM
- nurture (as a noun - "nurture sequence" is OK as action type)
- cadence
- sequences (unless users explicitly use them)
- dashboard (use "Today" instead)
- leads (use "Relationships" or "people" in UI)
- contacts (use "Relationships" or "people")
- network (use "Relationships")
- insights (use "Weekly Review" for reflection/hygiene content, "Signals" for external events)

**Voice Rules:**
- Short, directive, non-salesy
- "Do the work" language: plan, act, review, learn, repeat
- Avoid passive voice
- Use second person ("you") not third person ("the system")

### 1.2 Create Old → New Mapping Table

**Deliverable:** `docs/Planning/UI_Language_Mapping.md`

| Old Term | New Term | Context |
|----------|----------|---------|
| Dashboard | Today | Navigation, page title, route URL |
| Leads | Relationships | Navigation, page title, headers |
| Weekly Summary | Weekly Review | Navigation, page title, headers, route URL (simple rename) |
| Insights | Insights | Unchanged for P1 (content merge to Weekly Review moved to P2) |
| Content Ideas | Content Ideas | Unchanged |
| Signals | Signals | New section (external/contextual events) |
| "Your leads" | "Your relationships" | Page headers, empty states |
| "Add a lead" | "Add a relationship" | Buttons, modals |
| "Lead limit" | "Relationship limit" | Settings, upgrade modals |
| "No leads yet" | "No relationships yet" | Empty states |
| "Manage leads" | "Manage relationships" | Buttons, CTAs |
| "Pipeline review" | "Weekly review" | Weekly Review page |
| "Lead gen" | "Signals" | Signals page context |
| "News scraping" | "Signals" | Signals page context |
| `/app` | `/app` | Route URL (Today page) |
| `/app/weekly-summary` | `/app/weekly-review` | Route URL change |
| `/app/insights` | Remove or redirect to `/app/weekly-review` | Route URL removed |

**Note:** This mapping will be expanded during inventory phase.

---

## Phase 2: Inventory Every User-Facing String (Day 1-2)

### 2.1 Scope of Inventory

**Files to Search:**
- `web/src/app/app/**/*.tsx` - All page components
- `web/src/app/app/**/*.ts` - Client components
- `web/src/app/onboarding/**/*.tsx` - Onboarding flow
- `web/src/app/api/notifications/**/*.ts` - Email templates
- `web/src/app/app/components/**/*.tsx` - Shared components
- `web/src/app/app/components/**/*.ts` - Component utilities

**String Categories:**
1. Navigation labels (`web/src/app/app/layout.tsx`)
2. Page titles and headers (all page components)
3. Button labels (all components)
4. Empty states (all list pages)
5. Tooltips and help text
6. Onboarding copy (all onboarding steps)
7. System messages and toasts
8. Error states and validation messages
9. Email templates (notification routes)
10. Modal titles and descriptions

### 2.2 Inventory Method

**Process:**
1. Use grep to find all instances of old terms:
   ```bash
   grep -r "Dashboard\|dashboard" web/src/app
   grep -r "Leads\|leads" web/src/app
   grep -r "Weekly Summary\|weekly summary" web/src/app
   grep -r "Content Ideas\|content ideas" web/src/app
   grep -r "Insights\|insights" web/src/app
   ```

2. Create inventory spreadsheet with columns:
   - Current text
   - Location (file path + line number)
   - Replacement text
   - Context (page/section/component)
   - Notes (character limits, special considerations)

3. Export to `docs/Planning/UI_Language_Inventory.md`

### 2.3 Acceptance Criteria

- [ ] Every instance of old nav terms found and documented
- [ ] Every user-visible string categorized
- [ ] No remaining "old nav" terms in inventory (all mapped)

---

## Phase 3: Update Navigation & Top-Level Headers (Day 2)

### 3.1 Navigation Bar

**File:** `web/src/app/app/layout.tsx`

**Changes:**
- "Dashboard" → "Today"
- "Leads" → "Relationships"
- "Weekly Summary" → "Weekly Review" (simple rename)
- "Insights" → **Unchanged for P1** (remains in navigation, content merge moved to P2)
- "Content Ideas" → **Unchanged** (remains in navigation)
- "Signals" → **Add new nav item** (for external/contextual events)

### 3.2 Route URL Changes

**Route Changes (User-Facing):**
- `/app` → `/app` (Today page - no change needed, but update page title)
- `/app/weekly-summary` → `/app/weekly-review` (rename directory/file)
- `/app/insights` → **Unchanged for P1** (remains, content merge moved to P2)

**Files to Update:**
- `web/src/app/app/weekly-summary/` → Rename directory to `weekly-review/`
- `web/src/app/app/insights/` → Remove or redirect to weekly-review
- Update all internal links to use new routes
- Update navigation links in `layout.tsx`

### 3.3 Page Headers

**Files to Update:**
- `web/src/app/app/page.tsx` - Dashboard → Today page (update title/headers)
- `web/src/app/app/leads/page.tsx` - Leads → Relationships page (update title/headers)
- `web/src/app/app/weekly-summary/page.tsx` → `weekly-review/page.tsx` - Weekly Summary → Weekly Review (simple rename, update title/headers only)
- `web/src/app/app/content-ideas/page.tsx` - Content Ideas (unchanged, but verify no old terminology)
- `web/src/app/app/insights/page.tsx` - **Unchanged for P1** (content merge moved to P2)

**Pattern:**
- Page title: Use new nav label
- Subheader: Update to match new mental model
- Breadcrumbs: Update if present

---

## Phase 4: Update Onboarding to Teach New Mental Model (Day 2-3)

### 4.1 Onboarding Structure (Aligned to New Nav)

**Onboarding Steps:**
1. **Today:** "Here's what matters right now."
2. **Relationships:** "Who matters. Why. Where you left off."
3. **Daily Plan:** "Your plan for today (time-boxed)."
4. **Actions:** "Concrete moves you will take."
5. **Signals:** "External triggers that create smart actions."
6. **Weekly Review:** "Close the loop and decide next week's focus."

### 4.2 Onboarding Copy Updates

**Files to Update:**
- `web/src/app/onboarding/OnboardingFlow.tsx` - Step references
- `web/src/app/onboarding/steps/AddFirstLeadStep.tsx` - Update to "Add your first relationship"
- All onboarding step components - Remove CRM language

**Key Requirement:**
- Don't describe it as "managing leads"
- Describe it as making progress through relationships and actions
- Frame as "do the work" not "manage pipeline"

### 4.3 First-Run Tooltips / Guided Tour

**If exists:** Update to reference new nav labels
**If doesn't exist:** Consider adding brief tooltips on first visit to each nav section

---

## Phase 5: Refactor Screen-Level Language (Day 3-4)

### 5.1 Today (formerly Dashboard)

**File:** `web/src/app/app/page.tsx`

**Copy Themes:**
- Focus, clarity, next step, momentum
- Reframe as "current focus + next best moves" not "dashboard KPIs"
- Remove any metrics-heavy language that feels like a dashboard

**Example Updates:**
- "Dashboard" → "Today"
- "Your dashboard" → "Your focus for today"
- Any KPIs language → "What matters right now"

### 5.2 Relationships (formerly Leads)

**File:** `web/src/app/app/leads/page.tsx`

**Copy Updates:**
- Replace "leads/prospects" framing with "relationships/people/contacts"
- Replace "stage/status" with "where you left off" / "current context"
- "Add Lead" → "Add Relationship"
- "Your Leads" → "Your Relationships"
- "No leads yet" → "No relationships yet"
- "Lead limit" → "Relationship limit" (in upgrade modals)

**Component Files:**
- `web/src/app/app/leads/LeadList.tsx`
- `web/src/app/app/leads/LeadRow.tsx`
- `web/src/app/app/leads/AddLeadModal.tsx`
- `web/src/app/app/leads/EditLeadModal.tsx`

### 5.3 Daily Plan

**File:** `web/src/app/app/plan/page.tsx`

**Copy Updates:**
- Replace "task list" framing with "plan for the day"
- Use time blocks, priorities, and "must-do actions"
- Keep existing language but ensure no CRM terminology

### 5.4 Actions

**File:** `web/src/app/app/actions/page.tsx`

**Copy Updates:**
- Replace "outreach sequences" with "actions to take"
- Keep verbs explicit: call, email, follow up, ask, send, schedule
- Remove any "cadence" or "sequence" language

### 5.5 Weekly Review (formerly Weekly Summary)

**Files:**
- `web/src/app/app/weekly-summary/page.tsx` → Rename to `weekly-review/page.tsx`

**Copy Updates:**
- "Weekly Summary" → "Weekly Review" (all instances)
- Replace "pipeline review" with "weekly review"
- Emphasize reflection + decisions: what worked, what didn't, what to change
- Frame as closing the loop, not reporting metrics
- **Note:** Insights content merge deferred to P2 (high priority)

**Component Files:**
- Any weekly summary components (no changes to Insights components in P1)

**Component Files:**
- Any weekly summary components
- Insights components (StaleActionsSection, PatternDetectionSection, etc.) - integrate into Weekly Review

### 5.6 Content Ideas

**File:** `web/src/app/app/content-ideas/page.tsx`

**Copy Updates:**
- **Unchanged** - Content Ideas remains as-is
- Verify no old terminology (Dashboard, Leads, etc.) in copy
- Ensure consistent with new language system

### 5.6 Insights (Unchanged for P1)

**File:** `web/src/app/app/insights/page.tsx`

**Copy Updates:**
- **Unchanged for P1** - Insights page remains as-is
- Content merge into Weekly Review moved to P2 (high priority)
- Verify no old terminology (Dashboard, Leads, etc.) in copy

### 5.7 Signals (New Section)

**File:** `web/src/app/app/signals/page.tsx` (may need to create)

**Copy Updates:**
- New section for external/contextual events that may warrant new actions
- Position as inputs that inform actions, not a sales feed
- Focus on upstream discovery (not reflection/hygiene)
- "Signals that create opportunities for action"

**Note:** If Signals page doesn't exist yet, this may be a placeholder for future feature. Update navigation to include it, but page can be empty state for now.

### 5.8 Settings

**File:** `web/src/app/app/settings/page.tsx`

**Copy Updates:**
- Keep plain and simple
- Update any references to old nav terms
- "Lead limit" → "Relationship limit" (if present)

---

## Phase 6: Update Email Templates & Notifications (Day 4)

### 6.1 Email Templates

**Files:**
- `web/src/app/api/notifications/morning-plan/route.ts`
- `web/src/app/api/notifications/fast-win-reminder/route.ts`
- `web/src/app/api/notifications/follow-up-alerts/route.ts`
- `web/src/app/api/notifications/weekly-summary/route.ts` (if exists)

**Updates:**
- **Email Subject Lines:** Update all email subject lines
  - "Your Weekly Summary" → "Your Weekly Review"
  - "Weekly Summary Ready" → "Weekly Review Ready"
  - Any other subject lines with old terminology
- **Email Body:** Replace "Weekly Summary" with "Weekly Review" in email bodies
- Remove CRM language from email copy
- Update any references to "leads" → "relationships" in email text
- Update any references to "Insights" → "Weekly Review" in email text
- Ensure tone matches "do the work" voice

### 6.2 System Notifications / Toasts

**Search for:**
- Toast messages
- Success/error messages
- System alerts

**Update:**
- Use new nav terminology
- Remove CRM language

---

## Phase 7: Update Empty States & Microcopy (Day 4-5)

### 7.1 Empty States

**Files:** All list pages (Relationships, Actions, etc.)

**Pattern:**
- "No [old term] yet" → "No [new term] yet"
- CTAs updated to match new language
- Help text updated

### 7.2 Tooltips & Help Text

**Search for:**
- Tooltip components
- Help text in forms
- Field descriptions

**Update:**
- Use new terminology
- Remove CRM language
- Keep "do the work" voice

### 7.3 Button Labels

**Search for:**
- All button components
- CTA buttons
- Action buttons

**Update:**
- "Add Lead" → "Add Relationship"
- "Manage Leads" → "Manage Relationships"
- Any other old term references

---

## Phase 8: QA Plan - Language Consistency (Day 5)

### 8.1 String Coverage Test

**Process:**
1. Search codebase for forbidden terms:
   ```bash
   grep -r "dashboard\|pipeline\|prospects\|opportunities\|deal flow\|CRM\|cadence\|sequence" web/src/app --ignore-case
   ```

2. Verify no forbidden terms appear in UI
3. Check that all old nav terms are replaced

### 8.2 Flow-Based Review

**Test Flows:**
1. Onboarding flow - verify new language throughout
2. Today page - verify "Today" not "Dashboard"
3. Relationships page - verify "Relationships" not "Leads"
4. Weekly Review page - verify "Weekly Review" not "Weekly Summary"
5. Signals page - verify new terminology
6. Settings page - verify updated references

### 8.3 Tone Test

**Questions:**
- Does any screen sound like CRM, sales ops, or "pipeline management"?
- Can users describe what each section does without saying "it's a CRM"?
- Is the language short, directive, and non-salesy?

### 8.4 Acceptance Criteria

- [ ] No forbidden terms appear in UI
- [ ] New nav labels appear consistently in:
  - Navigation bar
  - Page headers
  - Onboarding references
  - Help text
  - Email templates
- [ ] Users can describe each section without saying "it's a CRM"
- [ ] All flows tested and working

---

## Implementation Checklist

### Phase 1: Language System
- [ ] Create glossary + forbidden terms list
- [ ] Create old → new mapping table
- [ ] Review and approve with team

### Phase 2: Inventory
- [ ] Search codebase for all old terms
- [ ] Create inventory spreadsheet
- [ ] Categorize all strings
- [ ] Review inventory completeness

### Phase 3: Navigation & Headers
- [ ] Update navigation bar labels
- [ ] Keep "Insights" in navigation for P1 (content merge moved to P2)
- [ ] Add "Signals" to navigation (if page exists or create placeholder)
- [ ] Rename route: `/app/weekly-summary` → `/app/weekly-review`
- [ ] Keep `/app/insights` route for P1 (content merge moved to P2)
- [ ] Update all internal links to new routes
- [ ] Update all page headers
- [ ] Update breadcrumbs (if present)

### Phase 4: Onboarding
- [ ] Update onboarding step references
- [ ] Update onboarding copy
- [ ] Update first-run tooltips (if exist)

### Phase 5: Screen-Level Language
- [ ] Update Today page
- [ ] Update Relationships page
- [ ] Update Daily Plan page
- [ ] Update Actions page
- [ ] Update Weekly Review page (simple rename, no content merge)
- [ ] Update Content Ideas page (verify no old terminology)
- [ ] Update Insights page (verify no old terminology, content merge moved to P2)
- [ ] Create/update Signals page (new section)
- [ ] Update Settings page

### Phase 6: Emails & Notifications
- [ ] Update email subject lines (Weekly Summary → Weekly Review)
- [ ] Update email templates (body copy)
- [ ] Update system notifications
- [ ] Test email rendering

### Phase 7: Empty States & Microcopy
- [ ] Update all empty states
- [ ] Update tooltips
- [ ] Update button labels
- [ ] Update help text

### Phase 8: QA
- [ ] Run string coverage test
- [ ] Test route URL changes (bookmarks, links)
- [ ] Verify Insights page still works (content merge moved to P2)
- [ ] Complete flow-based review
- [ ] Complete tone test
- [ ] Fix any regressions

---

## Rollout Plan

**Option A: Big Bang (Preferred)**
- Merge all copy changes at once
- Ship with short "What changed" modal on first login (optional)
- Coordinate with team for review

**Option B: Phased (If Needed)**
- Phase 1: Nav + top-level headers + onboarding
- Phase 2: Deep screen copy + empty states
- Phase 3: Emails/notifications + help docs

---

## Deliverables Checklist

- [ ] Glossary + forbidden terms list (`docs/Planning/UI_Language_Glossary.md`)
- [ ] Old → new mapping table (`docs/Planning/UI_Language_Mapping.md`)
- [ ] Strings inventory (`docs/Planning/UI_Language_Inventory.md`)
- [ ] Updated nav + page headers
- [ ] Updated onboarding + tour
- [ ] Updated microcopy (buttons, empty states, tooltips)
- [ ] Updated email templates
- [ ] Regression search tests (repo + UI)
- [ ] Release note / "What changed" modal (optional)

---

## Definition of Done

Language across NextBestMove is aligned to:
- **Today / Relationships / Daily Plan / Actions / Weekly Review / Signals / Settings**

And the product no longer triggers the "CRM" mental model in:
- Onboarding
- Day-to-day use
- Email communications
- System messages

---

## Clarifications (Resolved)

1. **Content Ideas vs Insights vs Signals:** 
   - ✅ Content Ideas remains unchanged
   - ✅ Insights page content reclassified as Weekly Review (reflection, hygiene, behavior feedback)
   - ✅ Signals is new section for external/contextual events (upstream discovery)
   - ✅ Insights removed from navigation

2. **Route URLs:** 
   - ✅ Route URLs should change (user-facing)
   - `/app/weekly-summary` → `/app/weekly-review`
   - `/app/insights` → Remove or redirect to `/app/weekly-review`

3. **Email Subject Lines:** 
   - ✅ Email subject lines should change
   - "Your Weekly Summary" → "Your Weekly Review"

4. **Database References in UI:** 
   - ✅ This is P2 - just need proper mapping to new names
   - Will be handled in Part 2 (Code Refactor)

5. **Legacy Data:** 
   - ✅ No real users yet, so no legacy data issues

---

## Part 2: Code Refactor (P2 - Lower Priority)

**Note:** This is a separate, lower-priority backlog item for future consideration.

### Scope

Refactor internal code to align with new language:
- API endpoint names (e.g., `/api/leads` → `/api/relationships`)
- TypeScript types and interfaces
- Variable names and function names
- Database column names (if any user-facing)
- Internal comments and documentation
- Database field name mapping in UI (error messages, etc.)

### High Priority P2 Item: Insights Content Merge

**Merge Insights screen content into Weekly Review:**
- Move Insights page content (stale actions, pattern detection, performance timeline) into Weekly Review
- Remove "Insights" from navigation
- Update Insights components to be part of Weekly Review
- Focus on reflection, hygiene, and behavior feedback (not upstream discovery)
- Estimated: 1-2 days additional work

### Estimated Time

2-3 days (similar to pins-to-leads refactor) + 1-2 days for Insights merge

### Priority

P2 - High priority for Insights merge, can be done after user-facing language is stable.

### Database Field Mapping (For P2)

When database field names appear in UI (e.g., error messages), map them:
- `leads` table → "relationships" in UI
- `weekly_summaries` table → "weekly review" in UI
- Any other user-facing database references

---

**End of UI Language Refactor Plan**

