-- 202512260002_create_idempotency_keys_table.sql
-- Creates idempotency_keys table for tracking Stripe operation idempotency
-- Prevents duplicate charges and other side effects

CREATE TABLE idempotency_keys (
  key TEXT PRIMARY KEY, -- The idempotency key (e.g., "checkout_session_userId_hash")
  result JSONB NOT NULL, -- Cached result of the operation
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for cleanup queries (delete old keys after 24 hours)
CREATE INDEX idx_idempotency_keys_created_at ON idempotency_keys(created_at);

-- Cleanup function to remove old idempotency keys (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_idempotency_keys()
RETURNS void AS $$
BEGIN
  DELETE FROM idempotency_keys
  WHERE created_at < now() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- RLS: Service role only (idempotency tracking is internal)
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access to idempotency_keys"
  ON idempotency_keys
  FOR ALL
  USING (auth.role() = 'service_role');

-- Note: Idempotency keys are short-lived (24 hours) and automatically cleaned up
-- This prevents unbounded table growth while still providing protection against
-- duplicate operations within a reasonable time window




