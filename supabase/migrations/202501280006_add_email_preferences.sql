-- Add email preferences to users table
-- Required for compliance (GDPR, CAN-SPAM, etc.)

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_morning_plan BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS email_fast_win_reminder BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS email_follow_up_alerts BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS email_weekly_summary BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS email_unsubscribed BOOLEAN NOT NULL DEFAULT false;

-- Add comments
COMMENT ON COLUMN users.email_morning_plan IS 'Receive daily plan email at 8am';
COMMENT ON COLUMN users.email_fast_win_reminder IS 'Receive reminder if fast win not completed by 2pm';
COMMENT ON COLUMN users.email_follow_up_alerts IS 'Receive alerts when follow-ups are overdue';
COMMENT ON COLUMN users.email_weekly_summary IS 'Receive weekly summary email on Sunday/Monday';
COMMENT ON COLUMN users.email_unsubscribed IS 'Global unsubscribe flag (overrides all preferences)';













