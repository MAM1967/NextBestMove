-- Enable RLS on tables that were missing it
-- Fixes Supabase Advisor security warnings
-- Created: December 10, 2025

BEGIN;

-- 1. calendar_sync_logs - Audit log, service role only
ALTER TABLE calendar_sync_logs ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for logging/debugging)
CREATE POLICY "Service role full access to calendar_sync_logs" ON calendar_sync_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Users can view their own sync logs via their calendar connections
CREATE POLICY "Users can view own calendar sync logs" ON calendar_sync_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM calendar_connections
      WHERE calendar_connections.id = calendar_sync_logs.calendar_connection_id
        AND calendar_connections.user_id = auth.uid()
    )
  );

-- 2. billing_events - Webhook audit log, service role only
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for webhook processing)
CREATE POLICY "Service role full access to billing_events" ON billing_events
  FOR ALL USING (auth.role() = 'service_role');

-- No user access needed - this is an audit log for webhooks

-- 3. user_patterns - User patterns, users can view their own
ALTER TABLE user_patterns ENABLE ROW LEVEL SECURITY;

-- Users can view their own patterns
CREATE POLICY "Users can view own patterns" ON user_patterns
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage patterns (for cron jobs that generate patterns)
CREATE POLICY "Service role can manage user_patterns" ON user_patterns
  FOR ALL USING (auth.role() = 'service_role');

-- 4. pre_call_briefs - Pre-call briefs, users can view their own
ALTER TABLE pre_call_briefs ENABLE ROW LEVEL SECURITY;

-- Users can view their own pre-call briefs
CREATE POLICY "Users can view own pre_call_briefs" ON pre_call_briefs
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage briefs (for cron jobs that generate briefs)
CREATE POLICY "Service role can manage pre_call_briefs" ON pre_call_briefs
  FOR ALL USING (auth.role() = 'service_role');

COMMIT;








