-- Migration: Create performance_timeline_data table for Phase 3: Performance Timeline
-- Premium plan feature: Historical performance visualization

-- Create performance_timeline_data table
CREATE TABLE IF NOT EXISTS performance_timeline_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  metrics JSONB NOT NULL, -- Store daily metrics
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_performance_timeline_user_date 
  ON performance_timeline_data(user_id, date DESC);

-- Add RLS policies
ALTER TABLE performance_timeline_data ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own timeline data
CREATE POLICY "Users can view their own performance timeline data"
  ON performance_timeline_data
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can insert/update (for cron job)
CREATE POLICY "Service role can manage performance timeline data"
  ON performance_timeline_data
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add comment
COMMENT ON TABLE performance_timeline_data IS 'Stores daily performance metrics for Premium users. Used for Performance Timeline visualization (Phase 3).';
COMMENT ON COLUMN performance_timeline_data.metrics IS 'JSONB object containing daily metrics: actions_completed, actions_created, replies_received, pins_created, pins_archived, streak_day, completion_rate, reply_rate';

