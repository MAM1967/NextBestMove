## P0/P1 Execution Plan – Interview & PRD Amendments

**Date:** December 23, 2025  
**Status:** Draft – drives pre-launch work after launch hardening  
**Scope:** Only items marked P0/P1 in `docs/backlog.md` that come from the latest ICP interviews and addenda.

---

## 1. Objectives

- Align the product with interview-validated behavior: cadence-first, one clear next move, trusted follow-ups.
- Ship launch-scoped email/notes-powered Signals and Notes Summary.
- Replace ad-hoc priority rules with the deterministic decision engine (Priority / In Motion / On Deck).
- Land the reverse-trial tier model (Free / Standard / Premium) in behavior and copy.

---

## 2. P0 – Execution Order

### P0.1 Relationship Cadence & “Due for Touch”

- **Goal:** Make relationship cadence a first-class primitive and surface “Needs attention / In rhythm / Intentional low-touch” everywhere.
- **Key Tasks:**
  - Add cadence + optional tier fields to Relationships (DB + API + UI).
  - Compute `next_touch_due_at` from last completed action or last meeting.
  - Add derived status to Today and Relationships list.
  - Update RLS and tests for new fields.

### P0.2 Single Best Action on Today

- **Goal:** Today must always answer “If I do only one thing, it’s this.”
- **Key Tasks:**
  - Consume decision engine scores to select a single “Best Action”.
  - Update Today UI to visually separate Best Action from the rest of the list.
  - Ensure empty/backlog edge cases still show a clear recommendation.

### P0.3 Promised Follow-Up Flag

- **Goal:** Help users keep explicit promises and avoid trust erosion.
- **Key Tasks:**
  - Add “Promised by…” metadata to actions (EOD / this week / date).
  - Elevate overdue promises in Today (visual severity + ordering).
  - Optionally trigger email nudges when promises become overdue.

### P0.4 “I Have X Minutes” Selector

- **Goal:** Turn micro-time windows (5/10/15 minutes) into decisive motion.
- **Key Tasks:**
  - Add duration estimates to actions.
  - Add 5 / 10 / 15 minute selector on Today.
  - Filter and present a single recommended action per selection.

### P0.5 Reverse Trial & Tiered Model Wiring

- **Goal:** Implement the Free / Standard / Premium reverse-trial model from onboarding through billing.
- **Key Tasks:**
  - Ensure new users start on Standard for 14 days, then auto-continue on Free unless upgraded.
  - Enforce Free tier limits (relationship cap, manual plan generation).
  - Align onboarding and in-app copy with “Memory Relief → Decision Automation → Intelligence & Leverage”.
  - Verify billing, paywall, and downgrade flows match the updated PRD.

---

## 3. P1 – Execution Order (After P0 Complete)

### P1.1 Deterministic Decision Engine (Now / Steady / Orbit)

- **Goal:** Implement the lane-based, deterministic decision engine described in the Decision Engine PRD amendment.
- **Key Tasks:**
  - Add precomputation of relationship state (cadence, momentum, overdue actions, insights).
  - Implement lane assignment (Now / Steady / Orbit) and NextMoveScore components.
  - Persist per-relationship next_move_action_id and per-action lane/score.
  - Wire lanes + scores into Today, Daily Plan, Actions, and Signals.

### P1.2 Signals v1 – Email Metadata Integration

- **Goal:** Launch-scoped email integration that powers Signals without becoming an inbox.
- **Key Tasks:**
  - Implement `email_metadata` table and ingestion pipeline for Gmail + Outlook (`Mail.Read`).
  - Extract last topics/asks/open loops into structured metadata.
  - Surface email-derived signals in the Signals tab and into the decision engine.
  - Respect privacy constraints (hashed addresses, snippets only, TTL).

### P1.3 Notes Summary / Interaction Topline

- **Goal:** Provide an at-a-glance relationship summary so users avoid digging through raw notes.
- **Key Tasks:**
  - Define summary aggregates (last/next interaction, pending/post-call actions, research topics, momentum).
  - Build per-relationship summary panel and a simple global rollup.
  - Hook into existing Interactions/ActionItems/Insights without introducing a new analytics surface.

### P1.4 Meeting Notes / Transcript Ingestion (Manual v1)

- **Goal:** Convert existing notes/transcripts into structured follow-ups and insights.
- **Key Tasks:**
  - Allow manual upload/attach of notes or transcripts per relationship.
  - Call extraction prompts to produce ActionItems and Insights.
  - Feed extracted entities into the decision engine and Notes Summary.

### P1.5 Multi-Calendar Awareness & Channel Progression

- **Goal:** Reflect real user context across multiple calendars and channels.
- **Key Tasks:**
  - Support multiple calendar connections per user and aggregate free/busy with confidence labels.
  - Add preferred channel to Relationships and detect stalled conversations.
  - Suggest channel progression nudges in Today/Actions.

---

## 4. Recommended Timeline (High-Level)

1. **Week 1–2:** P0.1–P0.3 (cadence + due-for-touch, Best Action, promised follow-ups).  
2. **Week 3:** P0.4–P0.5 (time selector, reverse trial wiring & copy alignment).  
3. **Week 4–5:** P1.1 (decision engine implementation + wiring into Today/Actions).  
4. **Week 6–7:** P1.2–P1.3 (Signals v1 + Notes Summary).  
5. **Week 8+:** P1.4–P1.5 (meeting notes ingestion, multi-calendar + channel progression).

Exact dates adjust based on remaining launch hardening and QA.

---

## 5. References

- `docs/PRD/NextBestMove_PRD_v1.md` (v1.0 with interview-informed addenda)
- `docs/backlog.md` (P0/P1/P2 backlog with new items)
- Email PRD addendum and DB schema (external doc)
- Notes PRD addendum (external doc)
- Decision Engine PRD amendment with algorithm (external doc)


