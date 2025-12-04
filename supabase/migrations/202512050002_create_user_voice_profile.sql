-- Migration: Create user_voice_profile table and enhance content_prompts for Phase 4: Content Engine with Voice Learning
-- Premium plan feature: AI-driven content generation learning user's tone

-- Create user_voice_profile table
CREATE TABLE IF NOT EXISTS user_voice_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  voice_characteristics JSONB NOT NULL, -- Learned voice characteristics
  sample_count INTEGER NOT NULL DEFAULT 0, -- Number of samples used
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_voice_profile_user ON user_voice_profile(user_id);

-- Add RLS policies
ALTER TABLE user_voice_profile ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own voice profile
CREATE POLICY "Users can view their own voice profile"
  ON user_voice_profile
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own voice profile
CREATE POLICY "Users can update their own voice profile"
  ON user_voice_profile
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Service role can manage voice profiles (for analysis)
CREATE POLICY "Service role can manage voice profiles"
  ON user_voice_profile
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add columns to content_prompts table for tracking edits
ALTER TABLE content_prompts 
ADD COLUMN IF NOT EXISTS user_edited BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS edited_text TEXT;

-- Add comments
COMMENT ON TABLE user_voice_profile IS 'Stores learned writing style characteristics for Premium users. Used for Content Engine with Voice Learning (Phase 4).';
COMMENT ON COLUMN user_voice_profile.voice_characteristics IS 'JSONB object containing learned characteristics: tone, formality, sentence_length, vocabulary_level, common_phrases, writing_patterns, topics, sample_texts';
COMMENT ON COLUMN content_prompts.user_edited IS 'True if user has edited the generated prompt';
COMMENT ON COLUMN content_prompts.edited_text IS 'The user-edited version of the prompt (used for voice learning)';

