-- Create notification_preferences table with channel support (email/push)
-- This replaces the simple boolean fields in users table with granular channel control

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Channel preferences per notification type
  morning_plan_email BOOLEAN NOT NULL DEFAULT true,
  morning_plan_push BOOLEAN NOT NULL DEFAULT false,
  
  fast_win_reminder_email BOOLEAN NOT NULL DEFAULT true,
  fast_win_reminder_push BOOLEAN NOT NULL DEFAULT false,
  
  follow_up_alerts_email BOOLEAN NOT NULL DEFAULT true,
  follow_up_alerts_push BOOLEAN NOT NULL DEFAULT false,
  
  weekly_summary_email BOOLEAN NOT NULL DEFAULT true,
  weekly_summary_push BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Migrate existing preferences from users table
INSERT INTO notification_preferences (user_id, morning_plan_email, fast_win_reminder_email, follow_up_alerts_email, weekly_summary_email)
SELECT id, 
  COALESCE(email_morning_plan, true),
  COALESCE(email_fast_win_reminder, true),
  COALESCE(email_follow_up_alerts, true),
  COALESCE(email_weekly_summary, true)
FROM users
ON CONFLICT (user_id) DO NOTHING;

-- Create push notification tokens table
CREATE TABLE IF NOT EXISTS push_notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'web', 'ios', 'android'
  device_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, token)
);

-- Create indexes for push tokens
CREATE INDEX IF NOT EXISTS idx_push_notification_tokens_user_id ON push_notification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_notification_tokens_platform ON push_notification_tokens(platform);

-- Add trigger to update updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_notification_tokens_updated_at
  BEFORE UPDATE ON push_notification_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE notification_preferences IS 'User preferences for notification delivery channels (email/push) per notification type';
COMMENT ON TABLE push_notification_tokens IS 'Stores push notification tokens for web, iOS, and Android devices';

