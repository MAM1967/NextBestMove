-- Add BYOK (Bring Your Own Key) fields to users table
-- Premium users can use their own OpenAI API keys

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ai_provider TEXT CHECK (ai_provider IN ('system', 'openai')),
ADD COLUMN IF NOT EXISTS ai_api_key_encrypted TEXT,
ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'gpt-4o-mini';

-- Add comment
COMMENT ON COLUMN users.ai_provider IS 'AI provider: system (uses our key) or openai (user key)';
COMMENT ON COLUMN users.ai_api_key_encrypted IS 'Encrypted OpenAI API key (only for premium users with BYOK)';
COMMENT ON COLUMN users.ai_model IS 'AI model to use: gpt-4o-mini, gpt-4, gpt-4-turbo, etc.';






