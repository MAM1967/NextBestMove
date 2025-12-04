-- 202512040003_add_user_patterns.sql
-- Professional plan Phase 1: Pattern Detection
-- Adds user_patterns table for storing detected behavior patterns and insights

BEGIN;

CREATE TABLE IF NOT EXISTS user_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL,
  pattern_data JSONB NOT NULL,
  insight_text TEXT,
  confidence_score NUMERIC(3, 2),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, pattern_type)
);

CREATE INDEX IF NOT EXISTS idx_user_patterns_user_id
  ON user_patterns(user_id);

CREATE INDEX IF NOT EXISTS idx_user_patterns_pattern_type
  ON user_patterns(pattern_type);

COMMIT;


