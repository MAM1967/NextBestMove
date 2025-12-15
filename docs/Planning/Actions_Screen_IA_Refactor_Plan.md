# Actions Screen IA Refactor Plan

**Status:** Draft  
**Owner:** Michael / Product + Engineering  
**Source:** ICP feedback (Karen) – “Where do I look?” on Actions screen  

---

## 1. Problem Statement

The current **Actions** screen creates cognitive overload and hides true priority:

- **No primary ordering principle**
  - Outreach, follow-ups, nurture, and content actions are mixed together.
  - Users must first decide *“where do I look?”* before they can decide *“what do I do?”*.
- **Grid layout implies equivalence**
  - 3-across cards visually tell the brain “all of this matters equally”.
  - This is the opposite of the product promise: “next best move” with clear priority.
- **Multi-line cards increase scan cost**
  - Titles + tags + badges + due date + notes = visual noise.
  - Users can’t quickly answer the question: **“What am I supposed to do right now?”**

Karen’s exact reaction (“where do I look?”) is the key signal that the IA is wrong, not just the styling.

---

## 2. Goal & Non‑Goals

**Goal**

Make the Actions screen feel like a **clear, prioritized queue of work**, where an independent operator can answer in seconds:

> “What requires my attention now, what’s in motion, and what’s optional background work?”

**Non‑Goals (for this change)**

- No new backend logic, tables, or endpoints.
- No filters, tabs, drag‑and‑drop, or customization.
- No changes to action generation logic.
- No major visual design rebrand – only layout & copy changes needed for clarity.

---

## 3. High‑Level Design

### 3.1 Principles

1. **One axis of organization** – one vertical list, not a grid.  
2. **One clear grouping** – explicit sections that match how users think.  
3. **One line per action** – compressed rows that are easy to scan.  
4. **Verbs first** – lead with the action the user should take, not the internal task type.

### 3.2 New IA: 4 Sections (in order)

1. **Needs attention now**  
   - Overdue actions  
   - Due today  
   - Explicit “reply pending” / waiting for user to act  
   - This is the “don’t miss this” zone.

2. **Conversations in motion**  
   - Follow‑ups scheduled  
   - Replies received  
   - Recently active threads  
   - Gives a sense of progress and momentum.

3. **Stay top of mind**  
   - Nurture / check‑ins  
   - Low‑frequency touches  
   - Non‑urgent relationship maintenance  
   - Addresses pacing and relationship hygiene.

4. **Optional / background**  
   - Content actions  
   - Non‑time‑sensitive “nice to do” items  
   - Keeps content and low‑leverage work from polluting the primary view.

### 3.3 Orientation Line

At the very top of the page (above the first section), add one short orientation line:

> **Focus on the first section. Everything else can wait.**

This matches the wedge promise: “next best moves” with low cognitive load.

---

## 4. UX Spec – Rows Instead of Cards

### 4.1 Layout Changes

Current:

- 3‑across card grid (`grid-cols-3` or similar).
- Each card has title, badge, tags, notes, etc.

New:

- **Single‑column vertical list** grouped by section headings.
- Each action is a **full‑width row** with a light separator.
- Use a simple structure:

```text
[Verb] · [Person] — [short context]                 [Due / Status]
```

Examples:

- `Follow up · Mike O’Brien — last week’s conversation             Overdue 2d`
- `Check in · Sarah L. — referral intro                            Due Fri`
- `Advance · Paul Schmidt — feedback loop                          Waiting`
- `Add value · Karen S. — relevant update                          Optional`

### 4.2 Visual Rules

- One line of primary text per action (truncate with ellipsis if needed).
- Right‑aligned, small secondary text for due/status (e.g. `Overdue 2d`, `Due Thu`, `Waiting`, `Optional`).
- Use subtle separators (`border-b border-zinc-100`) between rows.
- No heavy cards, no large color blocks.

### 4.3 What to Hide / De‑emphasize

Remove from the main list view (can appear in detail/hover later if needed):

- Big colored type badges (OUTREACH, FOLLOW_UP, NURTURE, CONTENT).
- Multiple badges or pill stacks.
- “Add note” links.
- Full status pills like `✓ Done`, `Sent` badges, etc.

These are secondary; the primary job of the screen is **decide and do**.

---

## 5. Mapping Existing Actions → New Sections

We will reuse existing fields (`action_type`, `state`, dates, reply flags) to group actions on the client.

### 5.1 Needs attention now

Candidate criteria (tunable, but no backend change needed):

- `due_date` < today (overdue) and state is not DONE/ARCHIVED.
- `due_date` is today.
- Actions where we’re explicitly waiting for the user (e.g. follow‑up due, reply needed).

Implementation approach:

- In the `Actions` page component, derive a `needsAttentionNow` array from the full actions list.

### 5.2 Conversations in motion

Candidate criteria:

- Follow‑up actions scheduled in the next N days.
- Actions linked to threads where `state` reflects recent reply (REPLIED / GOT_REPLY).
- Recently updated actions (within last 7 days) that are still active.

Implementation approach:

- Derive `conversationsInMotion` array from actions not in the first section, based on `state`, `last_contact_at`, or similar fields already present.

### 5.3 Stay top of mind

Candidate criteria:

- `action_type` in NURTURE / CHECK_IN / similar.
- Frequency low (e.g. next touch date > a few days away) or explicitly tagged as nurture.

Implementation:

- Derive `stayTopOfMind` array from remaining nurture‑type actions.

### 5.4 Optional / background

Candidate criteria:

- `action_type` in CONTENT or internal “optional” categories.
- Any remaining non‑urgent, non‑time‑sensitive work.

Implementation:

- Remaining actions after previous sections → `optionalBackground`.

---

## 6. Implementation Plan (Frontend‑Only)

### 6.1 Files Likely Touched

- `web/src/app/app/actions/page.tsx` (or equivalent Actions page component).
- Any shared `ActionCard` / `ActionRow` component in `app/actions` or `app/components`.

### 6.2 Steps

1. **Introduce a simple sectioned list structure**
   - Replace the current grid container with a `flex flex-col` or single‑column layout.
   - Define four sections in the Actions page:
     - `needsAttentionNow`, `conversationsInMotion`, `stayTopOfMind`, `optionalBackground`.
   - Implement a helper function to partition the existing `actions` array into those four buckets.

2. **Create a new `ActionListRow` component**
   - Props: `verb`, `personName`, `context`, `dueLabel`, `section`, `onClick`.
   - Responsible for rendering the one‑line layout and right‑aligned due/status text.
   - Internally maps existing fields (`action_type`, `description`, `person.name`, `due_date`, `state`) into display strings.

3. **Map current action types to verbs**
   - Example mapping (first draft, can refine in copy pass):
     - OUTREACH → “Start conversation”
     - FOLLOW_UP → “Advance conversation”
     - NURTURE → “Stay top of mind”
     - CONTENT → “Add value”
   - Implement as a simple utility function in the Actions module (no backend changes).

4. **Wire section headers and orientation copy**
   - At top of page: `Focus on the first section. Everything else can wait.`
   - For each section, add a small header + optional description:
     - Needs attention now – “Don’t miss these.”
     - Conversations in motion – “Threads you’re actively moving forward.”
     - Stay top of mind – “Low‑frequency touches to keep relationships warm.”
     - Optional / background – “Nice‑to‑do work and content.”

5. **Preserve existing interactions**
   - Clicking a row should still open the existing action detail / modal / flow.
   - All state transitions (Done, Got reply, Snooze, etc.) continue to use the same handlers.
   - No changes to API calls or Supabase tables.

6. **QA Checklist**
   - Actions page loads with no TS errors.
   - All actions appear in exactly one section.
   - Overdue / due‑today actions appear only in “Needs attention now”.
   - No references to old CRM‑ish labels in the visible UI (OUTREACH, NURTURE, etc.).
   - Mobile view: rows are readable and tappable, sections collapse naturally.

---

## 7. Acceptance Criteria

- **AC1 – Layout**
  - Actions screen uses a **single‑column** vertical list (no 3‑across grid).
  - Each action is rendered as **one line** with verb, person, short context, and right‑aligned due/status text.

- **AC2 – Grouping**
  - Actions are grouped into four sections in this order:
    1. Needs attention now  
    2. Conversations in motion  
    3. Stay top of mind  
    4. Optional / background  
  - Every visible action belongs to exactly one section.

- **AC3 – Copy**
  - At the top of the page, an orientation line reads:  
    **“Focus on the first section. Everything else can wait.”**
  - Row labels use **verbs** instead of internal type codes (no visible “OUTREACH”, “NURTURE”, “CONTENT” badges).

- **AC4 – Behavior**
  - All existing actions functionality (mark done, got reply, snooze, open detail) still works.
  - No backend changes or new endpoints are required.

- **AC5 – User Feedback**
  - In a quick usability review with 1–2 ICP users (e.g., Karen), they can answer within seconds:
    - “What should I look at first?”
    - “What’s in motion?”
    - “What’s optional?”

---

## 8. Follow‑Ups / Future Enhancements (Out of Scope for This Change)

- Per‑user toggles for hiding/showing sections.
- Additional filters (e.g., “Only show today”, “Only show nurture”).
- Saved views / custom segments.
- Richer action detail modal with history and notes.
- Per‑section metrics (e.g., count of overdue items).

These can be captured as separate P2+ backlog items once the new IA proves itself with ICP users.


