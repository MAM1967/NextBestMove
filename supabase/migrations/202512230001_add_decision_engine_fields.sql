-- 202512230001_add_decision_engine_fields.sql
-- Adds fields required for the deterministic decision engine (Priority / In Motion / On Deck)
-- Implements schema changes from docs/Architecture/Decision_Engine_Implementation_Spec.md

BEGIN;

-- Step 1: Create enums for decision engine
CREATE TYPE relationship_tier AS ENUM ('inner', 'active', 'warm', 'background');
CREATE TYPE relationship_cadence AS ENUM ('frequent', 'moderate', 'infrequent', 'ad_hoc');
CREATE TYPE momentum_trend AS ENUM ('increasing', 'stable', 'declining', 'unknown');
CREATE TYPE action_lane AS ENUM ('priority', 'in_motion', 'on_deck');
CREATE TYPE decision_confidence AS ENUM ('high', 'medium', 'low');

-- Step 2: Add fields to leads (relationships) table
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS cadence relationship_cadence,
  ADD COLUMN IF NOT EXISTS cadence_days INTEGER,
  ADD COLUMN IF NOT EXISTS tier relationship_tier,
  ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_touch_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS momentum_score NUMERIC(5,2) CHECK (momentum_score >= 0 AND momentum_score <= 100),
  ADD COLUMN IF NOT EXISTS momentum_trend momentum_trend DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS next_move_action_id UUID REFERENCES actions(id) ON DELETE SET NULL;

-- Step 3: Add fields to actions table
ALTER TABLE actions
  ADD COLUMN IF NOT EXISTS lane action_lane,
  ADD COLUMN IF NOT EXISTS next_move_score NUMERIC(5,2) CHECK (next_move_score >= 0 AND next_move_score <= 100),
  ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER CHECK (estimated_minutes > 0),
  ADD COLUMN IF NOT EXISTS promised_due_at TIMESTAMPTZ;

-- Step 4: Create indexes for decision engine queries
CREATE INDEX IF NOT EXISTS idx_leads_cadence ON leads(cadence) WHERE cadence IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_tier ON leads(tier) WHERE tier IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_next_touch_due_at ON leads(next_touch_due_at) WHERE next_touch_due_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_next_move_action_id ON leads(next_move_action_id) WHERE next_move_action_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_actions_lane ON actions(lane) WHERE lane IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_actions_next_move_score ON actions(next_move_score) WHERE next_move_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_actions_promised_due_at ON actions(promised_due_at) WHERE promised_due_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_actions_user_lane_score ON actions(user_id, lane, next_move_score) WHERE lane IS NOT NULL AND next_move_score IS NOT NULL;

-- Step 5: Create optional materialized view for relationship decision state
-- This can be used for faster queries, but we'll compute on-demand for v1
-- (Commented out for now - can be enabled later for performance optimization)
/*
CREATE MATERIALIZED VIEW IF NOT EXISTS relationship_decision_state AS
SELECT
  l.id AS relationship_id,
  l.user_id,
  l.cadence,
  l.cadence_days,
  l.tier,
  l.last_interaction_at,
  l.next_touch_due_at,
  l.momentum_score,
  l.momentum_trend,
  l.next_move_action_id,
  a.lane AS next_move_lane,
  a.next_move_score AS next_move_score,
  a.id AS next_move_action_id
FROM leads l
LEFT JOIN actions a ON a.id = l.next_move_action_id
WHERE l.status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_relationship_decision_state_user_id ON relationship_decision_state(user_id);
CREATE INDEX IF NOT EXISTS idx_relationship_decision_state_lane ON relationship_decision_state(next_move_lane);
*/

COMMIT;




