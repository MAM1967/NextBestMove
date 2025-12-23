## Decision Engine Implementation Spec – Priority / In Motion / On Deck

**Date:** December 23, 2025  
**Status:** Draft – aligns implementation with the “Decision engine PRD amendment with algorithm” addendum  
**Related Docs:**  
- PRD: `docs/PRD/NextBestMove_PRD_v1.md` (Section 11.2)  
- Planning: `docs/Planning/P0_P1_Interview_Amendments_Execution_Plan.md` (P1.1)  
- External: “Decision engine PRD amendment with algorithm.md”

---

## 1. Overview

The decision engine is a deterministic layer that:
- Computes per-relationship state from existing entities (Relationships, Actions, Interactions, Insights).
- Assigns each relationship to a lane: **Priority / In Motion / On Deck**.
- Scores candidate actions and selects a **single “Best Action”** per user for Today.
- Provides clean categorization for the **Actions** tab and supports **Signals / Notes Summary** surfaces.

LLMs are only used for extraction and drafting (per the external spec); **all lane assignment and ranking is rule-based.**

---

## 2. Data Model Additions

These can be implemented either as new columns on existing tables or as materialized / cached views. Exact schema to be finalized during implementation, but minimal proposed fields:

### 2.1 Relationships

- `relationships` (existing; called `leads` in some legacy code)
  - New fields:
    - `cadence` (ENUM: frequent | moderate | infrequent | ad_hoc | null) – user-set relationship cadence.
    - `cadence_days` (INT) – derived from cadence enum (Frequent=7, Moderate=14, Infrequent=30, Ad-hoc=null). Can be computed on-the-fly or cached.
    - `tier` (ENUM: inner | active | warm | background | null) – relationship importance tier.
    - `last_interaction_at` (TIMESTAMPTZ, nullable) – cached from `MAX(actions.completed_at WHERE person_id = id)`. Updated when actions complete.
    - `next_touch_due_at` (TIMESTAMPTZ, nullable) – computed from `last_interaction_at + cadence_days`.
    - `next_move_action_id` (UUID, nullable) – single best action per relationship (persisted for quick lookup).
    - `momentum_score` (NUMERIC, optional, 0–100) – computed from recent action patterns.
    - `momentum_trend` (ENUM: increasing | stable | declining | unknown) – trend indicator.

### 2.2 Actions

- `actions` (existing)
  - New fields:
    - `lane` (ENUM: priority | in_motion | on_deck | null).
    - `next_move_score` (NUMERIC, optional, cached).
    - `estimated_minutes` (INT, nullable; used for “I have X minutes”).
    - `promised_due_at` (TIMESTAMPTZ, nullable; used for “promised follow-up”).

### 2.3 RelationshipDecisionState (optional view/table)

Either:
- A materialized view `relationship_decision_state` (preferred for transparency), or
- A service-layer DTO computed on the fly.

Fields:
- `relationship_id`
- `lane` (priority | in_motion | on_deck)
- `next_move_action_id`
- `next_move_score`
- `next_move_reason` (TEXT – short explanation string)
- `confidence` (ENUM: high | medium | low – optional for future LLM usage)

---

## 3. Inputs and Precomputation

Per the external decision engine doc, precomputation is required for:

- `days_since_last_interaction` - Derived from `MAX(actions.completed_at WHERE person_id = relationship_id AND state IN ('DONE', 'SENT', 'REPLIED'))`
- `pending_actions_count` and `overdue_actions_count` - Count from `actions WHERE person_id = relationship_id AND state IN ('NEW', 'SENT', 'SNOOZED') AND due_date <= today`
- `awaiting_response` - Derived from `EXISTS(action WHERE person_id = relationship_id AND state = 'SENT' AND completed_at IS NOT NULL AND no subsequent REPLIED action)`
- `earliest_relevant_insight_date` - For v1, use user-level insights from `weekly_summaries.insight_text` (relationship-level insights are future work)
- `cadence_days` - Derived from relationship `cadence` enum: Frequent=7, Moderate=14, Infrequent=30, Ad-hoc=null
- `momentum_score` and `momentum_trend` - Computed from action completion patterns (recent completion rate, response rate, days between interactions)

**Data Sources:**
- **Interactions**: No separate `interactions` table. Derived from `actions` table:
  - `last_interaction_at` = `MAX(actions.completed_at WHERE person_id = X)`
  - `awaiting_response` = `EXISTS(action WHERE state = 'SENT' AND person_id = X AND no REPLIED action exists)`
- **Insights**: Currently user-level only (`weekly_summaries.insight_text`). Relationship-level insights are future work (Signals v1 / Notes Summary features).

**Implementation sketch:**

- Create a server-side module `web/src/lib/decision-engine/state.ts` that:
  - Accepts `user_id`.
  - Queries relationships + actions (and later Signals when available).
  - Computes derived fields from actions (interactions, awaiting_response).
  - Returns an in-memory map:
    - `Map<relationship_id, RelationshipState>` with the fields above.

Caching:
- Safe to compute on demand per request (Today / Actions) for v1.
- Later optimization: daily cron to refresh cached state for all active users.

---

## 4. Lane Assignment Rules

Rename lanes from NOW / STEADY / ORBIT to:
- **Priority** – requires attention now.
- **In Motion** – active, within cadence.
- **On Deck** – no pending work, light-touch / nurture.

For each relationship `R`, using precomputed state:

**Priority lane:**
- If any of:
  - `overdue_actions_count > 0`, OR
  - `earliest_relevant_insight_date ≤ today + 5 business days`, OR
  - `momentum_trend = 'declining'` AND `days_since_last_interaction > cadence_days`, OR
  - `awaiting_response = true` AND response is overdue (e.g., > N days).

**In Motion lane:**
- Else if any of:
  - `pending_actions_count > 0`, OR
  - `next_touch_due_at` within cadence window.

**On Deck lane:**
- Else:
  - No pending actions and no imminent insights.
  - Relationship is low-touch or nurture-focused.

These rules should live in `web/src/lib/decision-engine/lanes.ts`.

---

## 5. Action Scoring and Best Action Selection

For each candidate action `A`:

### 5.1 Lane Assignment (Action)

- Use relationship lane + action due date/priority to assign:
  - **Priority**:
    - `due_date ≤ today + 2 business days`, OR
    - `priority = 'high' AND state = 'NEW' | 'SENT'`, OR
    - Blocking another pending action.
  - **In Motion**:
    - `due_date ≤ today + 14 days`, AND
    - Relationship lane ∈ {Priority, In Motion}.
  - **On Deck**:
    - Everything else (including long-range nurture).

Persist `actions.lane` whenever plans are generated or state changes.

### 5.2 NextMoveScore Components

(Mapping from external doc; exact weights can be constants in code.)

- **Urgency (0–40)**  
  - Overdue → 40  
  - Due ≤ 2 days → 30  
  - Due ≤ 7 days → 20  
  - No due date → 5

- **Stall Risk (0–25)**  
  - `momentum_trend = declining` → +15  
  - `days_since_last_interaction > cadence_days` → +10

- **Value (0–20)**  
  - `tier = inner` or importance high → +20  
  - `active` / medium → +10  
  - `warm/background` / low → +5

- **Effort Bias (0–15)**  
  - `estimated_minutes ≤ 30` (or `estimated_hours ≤ 0.5`) → +15  
  - `≤ 120 minutes` → +10  
  - longer → +5

**NextMoveScore = Urgency + StallRisk + Value + EffortBias**

This logic should live in `web/src/lib/decision-engine/scoring.ts`.

### 5.3 Best Action

For each user:
- Collect candidate actions in **Priority** and **In Motion** lanes.
- Compute `next_move_score` and persist on each action.
- Select the highest scoring action as the **Best Action**.
- Expose via:
  - A dedicated API (`GET /api/decision-engine/best-action`) and/or
  - Existing Today/Daily Plan data loaders.

UI contract:
- Today must always show a single Best Action (or a clear empty state when there is genuinely nothing to do).

---

## 6. Surfaces & Integration Points

### 6.1 Today

- Show:
  - Best Action at the top (Priority lane).
  - Remaining actions grouped by lane (Priority, In Motion, On Deck) and ordered by score.
- Respect **“I have X minutes”** filter:
  - When user selects 5/10/15 minutes, filter to actions with `estimated_minutes <= X`, prefer Priority then In Motion, and show a single recommended action.

### 6.2 Daily Plan

- Use the decision engine instead of legacy priority rules:
  - Capacity logic from calendar stays as-is.
  - Slots filled in order: Best Action → remaining Priority → In Motion → On Deck (as capacity allows).

### 6.3 Actions Tab

- Group actions by lane then by batch type (outreach / follow_up / post_meeting / nurture), per external spec:
  - Priority → Follow-up / Post-meeting / Outreach / Nurture
  - In Motion → same grouping
  - On Deck → primarily nurture / someday items

### 6.4 Signals & Notes Summary

- Future P1 work (Signals v1 / Notes Summary) can feed additional signals into:
  - Stall risk (e.g., open loops from email metadata).
  - Insights (deadlines, opportunities, risks).

---

## 7. Implementation Steps (High-Level)

1. **Schema changes** – migrations for:
   - `leads` table: `cadence`, `tier`, `last_interaction_at`, `next_touch_due_at`, `next_move_action_id`, `momentum_score`, `momentum_trend`
   - `actions` table: `lane`, `next_move_score`, `estimated_minutes`, `promised_due_at`
   - New ENUMs: `relationship_cadence`, `relationship_tier`, `momentum_trend`, `action_lane`
2. **State precomputation module** – `state.ts` for per-relationship aggregates.  
3. **Lane assignment** – `lanes.ts` for relationship + action lanes.  
4. **Scoring** – `scoring.ts` for NextMoveScore + Best Action logic.  
5. **API and UI wiring** – integrate into Today, Daily Plan, Actions.  
6. **Telemetry** – log lane/score breakdowns for debugging ("why this action"):
   - Format: `{action_id, relationship_id, lane, next_move_score, urgency, stall_risk, value, effort_bias, reason}`
   - Log when actions are selected for plans or when Best Action is computed
   - Use structured JSON logging (console.log with JSON.stringify)
7. **Tests** – unit tests on scoring/lanes + integration tests on Today/Actions behavior:
   - Regression tests: Compare old vs new plan generation with same input data
   - Verify capacity logic unchanged (calendar-based capacity stays as-is)
   - Test edge cases: no actions, all overdue, mixed lanes

---

## 8. Non-Goals (v1)

- No automatic LLM-based lane assignment or ranking.  
- No complex per-user tunable weights (weights are constants).  
- No new analytics UI; explanation tooling is limited to logs and lightweight hints.


