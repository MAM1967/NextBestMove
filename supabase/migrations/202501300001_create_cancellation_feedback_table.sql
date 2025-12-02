-- Create cancellation_feedback table to store win-back campaign feedback
CREATE TABLE IF NOT EXISTS cancellation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT, -- Selected reason (e.g., "too_expensive", "not_useful", etc.)
  additional_feedback TEXT, -- Free-form text feedback
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_user_id ON cancellation_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_created_at ON cancellation_feedback(created_at DESC);

-- Enable RLS
ALTER TABLE cancellation_feedback ENABLE ROW LEVEL SECURITY;

-- Users can only insert their own feedback
CREATE POLICY "Users can insert own feedback" ON cancellation_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback" ON cancellation_feedback
  FOR SELECT USING (auth.uid() = user_id);

