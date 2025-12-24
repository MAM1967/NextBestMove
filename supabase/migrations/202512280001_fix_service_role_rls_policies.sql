-- 202512280001_fix_service_role_rls_policies.sql
-- Fix RLS policies for service_role access to idempotency_keys and billing_events
-- The issue: auth.role() doesn't work correctly with service_role key
-- Solution: Use auth.jwt() ->> 'role' instead, or check for service_role differently

-- Fix idempotency_keys policy
DROP POLICY IF EXISTS "Service role full access to idempotency_keys" ON idempotency_keys;

CREATE POLICY "Service role full access to idempotency_keys"
  ON idempotency_keys
  FOR ALL
  USING (
    -- Check if role is service_role from JWT
    (auth.jwt() ->> 'role') = 'service_role'
    OR
    -- Fallback: service_role key should bypass RLS, so allow if no user context
    auth.uid() IS NULL
  );

-- Fix billing_events policy
DROP POLICY IF EXISTS "Service role full access to billing_events" ON billing_events;

CREATE POLICY "Service role full access to billing_events"
  ON billing_events
  FOR ALL
  USING (
    -- Check if role is service_role from JWT
    (auth.jwt() ->> 'role') = 'service_role'
    OR
    -- Fallback: service_role key should bypass RLS, so allow if no user context
    auth.uid() IS NULL
  );

