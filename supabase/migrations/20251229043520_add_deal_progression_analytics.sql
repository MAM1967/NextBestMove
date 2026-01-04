-- Add deal progression tracking to actions table
ALTER TABLE actions
ADD COLUMN IF NOT EXISTS deal_stage TEXT, -- 'prospecting', 'qualifying', 'proposal', 'negotiation', 'closed_won', 'closed_lost'
ADD COLUMN IF NOT EXISTS deal_value DECIMAL(10, 2);

-- Create analytics_insights table for additional insights
CREATE TABLE IF NOT EXISTS analytics_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'deal_progression', 'response_time', 'conversion_rate', etc.
  insight_data JSONB NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  UNIQUE(user_id, insight_type, period_start)
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_analytics_insights_user_period ON analytics_insights(user_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_insights_type ON analytics_insights(insight_type);

-- Add trigger to update updated_at (if function exists)
CREATE TRIGGER update_analytics_insights_updated_at
  BEFORE UPDATE ON analytics_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON COLUMN actions.deal_stage IS 'Current stage in deal progression pipeline';
COMMENT ON COLUMN actions.deal_value IS 'Monetary value of the deal (if applicable)';
COMMENT ON TABLE analytics_insights IS 'Stores calculated analytics insights for users over time periods';

