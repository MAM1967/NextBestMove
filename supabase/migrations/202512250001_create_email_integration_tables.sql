-- 202512250001_create_email_integration_tables.sql
-- Creates email_connections and email_metadata tables for Signals v1 (NEX-11)
-- Privacy-first design: hashed addresses, snippets only, TTL

BEGIN;

-- Reuse calendar provider enum if it exists, otherwise create it
-- Note: We're using the same enum type for consistency
DO $$ BEGIN
  CREATE TYPE email_provider AS ENUM ('gmail', 'outlook');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Email connection status enum (reuse calendar pattern)
DO $$ BEGIN
  CREATE TYPE email_connection_status AS ENUM ('active', 'expired', 'error', 'disconnected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Email connections table (similar to calendar_connections)
CREATE TABLE IF NOT EXISTS email_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider email_provider NOT NULL,
  refresh_token TEXT NOT NULL, -- Encrypted refresh token
  access_token TEXT, -- Encrypted access token (temporary)
  expires_at INTEGER, -- Unix timestamp when access_token expires
  email_address TEXT NOT NULL, -- User's email address (for reference, not hashed)
  status email_connection_status NOT NULL DEFAULT 'active',
  last_sync_at TIMESTAMPTZ, -- Last successful sync
  error_message TEXT, -- Last error message if status is 'error'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, provider) -- One connection per provider per user
);

-- Indexes for email_connections
CREATE INDEX IF NOT EXISTS idx_email_connections_user_id ON email_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_email_connections_provider ON email_connections(provider);
CREATE INDEX IF NOT EXISTS idx_email_connections_status ON email_connections(status);
CREATE INDEX IF NOT EXISTS idx_email_connections_user_status ON email_connections(user_id, status);

-- Trigger to update updated_at
CREATE TRIGGER update_email_connections_updated_at
  BEFORE UPDATE ON email_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Email metadata table (privacy-first design)
-- Stores email metadata for signals extraction
CREATE TABLE IF NOT EXISTS email_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_connection_id UUID REFERENCES email_connections(id) ON DELETE CASCADE,
  
  -- Email identification
  message_id TEXT NOT NULL, -- Provider's message ID (Gmail/Outlook message ID)
  thread_id TEXT, -- Thread/conversation ID
  
  -- Privacy-first: hashed addresses instead of raw addresses
  from_email_hash TEXT NOT NULL, -- SHA-256 hash of sender email
  to_email_hash TEXT, -- SHA-256 hash of recipient email (user's email)
  
  -- Email metadata (safe to store)
  subject TEXT, -- Email subject
  snippet TEXT, -- First 200 characters of email body (privacy-safe preview)
  received_at TIMESTAMPTZ NOT NULL, -- When email was received
  
  -- Relationship mapping (optional - may be null if sender not in leads)
  person_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  
  -- Extracted signals (from AI/rule-based extraction)
  last_topic TEXT, -- Last topic discussed
  ask TEXT, -- Any asks/questions in email
  open_loops TEXT[], -- Array of open loops/action items mentioned
  labels TEXT[], -- Email labels/categories
  priority TEXT, -- Extracted priority (high/medium/low/normal)
  
  -- Metadata for processing
  processed_at TIMESTAMPTZ, -- When signals were extracted
  expires_at TIMESTAMPTZ NOT NULL, -- TTL: delete after 90 days (privacy-first)
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint: one metadata record per message per user
  UNIQUE(user_id, email_connection_id, message_id)
);

-- Indexes for email_metadata
CREATE INDEX IF NOT EXISTS idx_email_metadata_user_id ON email_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_email_metadata_email_connection_id ON email_metadata(email_connection_id);
CREATE INDEX IF NOT EXISTS idx_email_metadata_person_id ON email_metadata(person_id) WHERE person_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_metadata_from_email_hash ON email_metadata(from_email_hash);
CREATE INDEX IF NOT EXISTS idx_email_metadata_received_at ON email_metadata(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_metadata_expires_at ON email_metadata(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_metadata_user_received ON email_metadata(user_id, received_at DESC);

-- Composite index for relationship queries
CREATE INDEX IF NOT EXISTS idx_email_metadata_person_received ON email_metadata(person_id, received_at DESC) WHERE person_id IS NOT NULL;

-- Trigger to update updated_at
CREATE TRIGGER update_email_metadata_updated_at
  BEFORE UPDATE ON email_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically set expires_at to 90 days from now
CREATE OR REPLACE FUNCTION set_email_metadata_ttl()
RETURNS TRIGGER AS $$
BEGIN
  -- Set expires_at to 90 days from creation if not explicitly set
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NOW() + INTERVAL '90 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_email_metadata_default_ttl
  BEFORE INSERT ON email_metadata
  FOR EACH ROW
  EXECUTE FUNCTION set_email_metadata_ttl();

-- Function to clean up expired email metadata (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_email_metadata()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM email_metadata
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Helper function to hash email addresses (SHA-256)
-- Note: This should be called from application code, not SQL
-- CREATE OR REPLACE FUNCTION hash_email(email TEXT)
-- RETURNS TEXT AS $$
-- BEGIN
--   RETURN encode(digest(email, 'sha256'), 'hex');
-- END;
-- $$ LANGUAGE plpgsql IMMUTABLE;

-- RLS policies
ALTER TABLE email_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_metadata ENABLE ROW LEVEL SECURITY;

-- Users can only access their own email connections
CREATE POLICY "Users can view own email connections" ON email_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own email connections" ON email_connections
  FOR ALL USING (auth.uid() = user_id);

-- Users can only access their own email metadata
CREATE POLICY "Users can view own email metadata" ON email_metadata
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own email metadata" ON email_metadata
  FOR ALL USING (auth.uid() = user_id);

COMMIT;




