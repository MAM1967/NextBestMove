-- Migration: Add manual voice samples table for Phase 4: Content Engine with Voice Learning
-- Allows users to manually add sample emails and LinkedIn posts for better voice profile accuracy

-- Create manual_voice_samples table
CREATE TABLE IF NOT EXISTS manual_voice_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sample_type TEXT NOT NULL CHECK (sample_type IN ('email', 'linkedin_post', 'other')),
  content TEXT NOT NULL CHECK (length(trim(content)) >= 50), -- Minimum 50 characters
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_manual_voice_samples_user_id ON manual_voice_samples(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_voice_samples_user_type ON manual_voice_samples(user_id, sample_type);

-- Add RLS policies
ALTER TABLE manual_voice_samples ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own manual samples
CREATE POLICY "Users can view their own manual samples"
  ON manual_voice_samples
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own manual samples
CREATE POLICY "Users can insert their own manual samples"
  ON manual_voice_samples
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own manual samples
CREATE POLICY "Users can update their own manual samples"
  ON manual_voice_samples
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own manual samples
CREATE POLICY "Users can delete their own manual samples"
  ON manual_voice_samples
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_manual_voice_samples_updated_at
  BEFORE UPDATE ON manual_voice_samples
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE manual_voice_samples IS 'Stores manually added text samples (emails, LinkedIn posts) for voice profile learning. Premium feature.';
COMMENT ON COLUMN manual_voice_samples.sample_type IS 'Type of sample: email, linkedin_post, or other';
COMMENT ON COLUMN manual_voice_samples.content IS 'The actual text content (minimum 50 characters)';

