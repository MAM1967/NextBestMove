-- NextBestMove initial schema migration
-- Source of truth: docs/Architecture/Database_Schema.md

-- Enums
CREATE TYPE pin_status AS ENUM ('ACTIVE', 'SNOOZED', 'ARCHIVED');

CREATE TYPE action_type AS ENUM (
  'OUTREACH',
  'FOLLOW_UP',
  'NURTURE',
  'CALL_PREP',
  'POST_CALL',
  'CONTENT',
  'FAST_WIN'
);

CREATE TYPE action_state AS ENUM (
  'NEW',
  'SENT',
  'REPLIED',
  'SNOOZED',
  'DONE',
  'ARCHIVED'
);

CREATE TYPE calendar_provider AS ENUM ('google', 'outlook');

CREATE TYPE calendar_connection_status AS ENUM ('active', 'expired', 'error', 'disconnected');

CREATE TYPE capacity_level AS ENUM ('micro', 'light', 'standard', 'heavy', 'default');

CREATE TYPE content_prompt_type AS ENUM ('WIN_POST', 'INSIGHT_POST');

CREATE TYPE content_prompt_status AS ENUM ('DRAFT', 'POSTED', 'ARCHIVED');

CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled');

-- Helper function to keep updated_at fresh
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  calendar_connected BOOLEAN NOT NULL DEFAULT false,
  streak_count INTEGER NOT NULL DEFAULT 0,
  last_action_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_last_action_date ON users(last_action_date);

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- person_pins
CREATE TABLE IF NOT EXISTS person_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  notes TEXT,
  status pin_status NOT NULL DEFAULT 'ACTIVE',
  snooze_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_url CHECK (
    url LIKE 'https://%' OR 
    url LIKE 'http://%' OR 
    url LIKE 'mailto:%'
  )
);

CREATE INDEX IF NOT EXISTS idx_person_pins_user_id ON person_pins(user_id);
CREATE INDEX IF NOT EXISTS idx_person_pins_status ON person_pins(status);
CREATE INDEX IF NOT EXISTS idx_person_pins_user_status ON person_pins(user_id, status);
CREATE INDEX IF NOT EXISTS idx_person_pins_snooze_until ON person_pins(snooze_until) WHERE status = 'SNOOZED';

CREATE TRIGGER update_person_pins_updated_at
  BEFORE UPDATE ON person_pins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- actions
CREATE TABLE IF NOT EXISTS actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  person_id UUID REFERENCES person_pins(id) ON DELETE SET NULL,
  action_type action_type NOT NULL,
  state action_state NOT NULL DEFAULT 'NEW',
  description TEXT,
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  snooze_until DATE,
  notes TEXT,
  auto_created BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_due_date CHECK (due_date >= DATE(created_at))
);

CREATE INDEX IF NOT EXISTS idx_actions_user_id ON actions(user_id);
CREATE INDEX IF NOT EXISTS idx_actions_person_id ON actions(person_id);
CREATE INDEX IF NOT EXISTS idx_actions_state ON actions(state);
CREATE INDEX IF NOT EXISTS idx_actions_due_date ON actions(due_date);
CREATE INDEX IF NOT EXISTS idx_actions_user_state_due ON actions(user_id, state, due_date);
CREATE INDEX IF NOT EXISTS idx_actions_snooze_until ON actions(snooze_until) WHERE state = 'SNOOZED';

CREATE TRIGGER update_actions_updated_at
  BEFORE UPDATE ON actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- auto-unsnooze helper
CREATE OR REPLACE FUNCTION auto_unsnooze_items()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE person_pins
  SET status = 'ACTIVE', snooze_until = NULL
  WHERE status = 'SNOOZED'
    AND snooze_until IS NOT NULL
    AND snooze_until <= CURRENT_DATE;

  UPDATE actions
  SET state = 'NEW', snooze_until = NULL
  WHERE state = 'SNOOZED'
    AND snooze_until IS NOT NULL
    AND snooze_until <= CURRENT_DATE;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_snooze_dates
  AFTER INSERT OR UPDATE ON actions
  FOR EACH ROW
  WHEN (NEW.snooze_until IS NOT NULL)
  EXECUTE FUNCTION auto_unsnooze_items();

-- daily_plans
CREATE TABLE IF NOT EXISTS daily_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  focus_statement TEXT,
  capacity capacity_level NOT NULL DEFAULT 'default',
  free_minutes INTEGER,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_plans_user_id ON daily_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_plans_date ON daily_plans(date);
CREATE INDEX IF NOT EXISTS idx_daily_plans_user_date ON daily_plans(user_id, date);

CREATE TRIGGER update_daily_plans_updated_at
  BEFORE UPDATE ON daily_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- daily_plan_actions
CREATE TABLE IF NOT EXISTS daily_plan_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_plan_id UUID NOT NULL REFERENCES daily_plans(id) ON DELETE CASCADE,
  action_id UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  is_fast_win BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(daily_plan_id, action_id),
  UNIQUE(daily_plan_id, position)
);

CREATE INDEX IF NOT EXISTS idx_daily_plan_actions_daily_plan_id ON daily_plan_actions(daily_plan_id);
CREATE INDEX IF NOT EXISTS idx_daily_plan_actions_action_id ON daily_plan_actions(action_id);
CREATE INDEX IF NOT EXISTS idx_daily_plan_actions_position ON daily_plan_actions(daily_plan_id, position);

-- weekly_summaries
CREATE TABLE IF NOT EXISTS weekly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  days_active INTEGER NOT NULL DEFAULT 0,
  actions_completed INTEGER NOT NULL DEFAULT 0,
  replies INTEGER NOT NULL DEFAULT 0,
  calls_booked INTEGER NOT NULL DEFAULT 0,
  insight_text TEXT NOT NULL,
  narrative_summary TEXT,
  next_week_focus TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_weekly_summaries_user_id ON weekly_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_week_start ON weekly_summaries(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_user_week ON weekly_summaries(user_id, week_start_date DESC);

CREATE TRIGGER update_weekly_summaries_updated_at
  BEFORE UPDATE ON weekly_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- content_prompts
CREATE TABLE IF NOT EXISTS content_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weekly_summary_id UUID REFERENCES weekly_summaries(id) ON DELETE SET NULL,
  type content_prompt_type NOT NULL,
  content TEXT NOT NULL,
  status content_prompt_status NOT NULL DEFAULT 'DRAFT',
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_prompts_user_id ON content_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_content_prompts_status ON content_prompts(status);
CREATE INDEX IF NOT EXISTS idx_content_prompts_user_status ON content_prompts(user_id, status);

CREATE TRIGGER update_content_prompts_updated_at
  BEFORE UPDATE ON content_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- calendar_connections
CREATE TABLE IF NOT EXISTS calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider calendar_provider NOT NULL,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  expires_at INTEGER,
  calendar_id TEXT NOT NULL,
  status calendar_connection_status NOT NULL DEFAULT 'active',
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_calendar_connections_user_id ON calendar_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_provider ON calendar_connections(provider);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_status ON calendar_connections(status);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_user_status ON calendar_connections(user_id, status);

CREATE OR REPLACE FUNCTION update_user_calendar_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET calendar_connected = EXISTS (
    SELECT 1 FROM calendar_connections
    WHERE user_id = NEW.user_id
      AND status = 'active'
  )
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calendar_connected_flag
  AFTER INSERT OR UPDATE OR DELETE ON calendar_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_user_calendar_status();

CREATE TRIGGER update_calendar_connections_updated_at
  BEFORE UPDATE ON calendar_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- calendar_sync_logs (optional)
CREATE TABLE IF NOT EXISTS calendar_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_connection_id UUID NOT NULL REFERENCES calendar_connections(id) ON DELETE CASCADE,
  operation TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_sync_logs_connection_id ON calendar_sync_logs(calendar_connection_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_logs_created_at ON calendar_sync_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_logs_status ON calendar_sync_logs(status);

-- billing_customers
CREATE TABLE IF NOT EXISTS billing_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  default_payment_method TEXT,
  currency TEXT NOT NULL DEFAULT 'usd',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_customers_user_id ON billing_customers(user_id);

CREATE TRIGGER update_billing_customers_updated_at
  BEFORE UPDATE ON billing_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- billing_subscriptions
CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_customer_id UUID NOT NULL REFERENCES billing_customers(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT NOT NULL,
  status subscription_status NOT NULL DEFAULT 'trialing',
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  trial_ends_at TIMESTAMPTZ,
  latest_invoice_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_customer ON billing_subscriptions(billing_customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_status ON billing_subscriptions(status);

CREATE TRIGGER update_billing_subscriptions_updated_at
  BEFORE UPDATE ON billing_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- billing_events (optional)
CREATE TABLE IF NOT EXISTS billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_events_type ON billing_events(type);
CREATE INDEX IF NOT EXISTS idx_billing_events_created_at ON billing_events(created_at DESC);

-- Auto-archive old actions
CREATE OR REPLACE FUNCTION auto_archive_old_actions()
RETURNS void AS $$
BEGIN
  UPDATE actions
  SET state = 'ARCHIVED'
  WHERE state = 'DONE'
    AND completed_at IS NOT NULL
    AND completed_at < now() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Streak calculation (simplified)
CREATE OR REPLACE FUNCTION calculate_user_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  streak_count INTEGER := 0;
  check_date DATE := CURRENT_DATE;
BEGIN
  WHILE EXISTS (
    SELECT 1 FROM actions
    WHERE user_id = p_user_id
      AND state IN ('DONE', 'REPLIED')
      AND completed_at::DATE = check_date
  ) LOOP
    streak_count := streak_count + 1;
    check_date := check_date - INTERVAL '1 day';
  END LOOP;

  RETURN streak_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET streak_count = calculate_user_streak(p_user_id),
      last_action_date = (
        SELECT MAX(completed_at::DATE)
        FROM actions
        WHERE user_id = p_user_id
          AND state IN ('DONE', 'REPLIED')
      )
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- RLS setup (note: adjust auth.uid() to match Supabase environment)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plan_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_subscriptions ENABLE ROW LEVEL SECURITY;

-- For Supabase, auth.uid() is available; policies mirror docs
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own pins" ON person_pins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own pins" ON person_pins
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own actions" ON actions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own actions" ON actions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own daily plans" ON daily_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own weekly summaries" ON weekly_summaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own content prompts" ON content_prompts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own content prompts" ON content_prompts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own calendar connections" ON calendar_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own calendar connections" ON calendar_connections
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own billing customer" ON billing_customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subscriptions" ON billing_subscriptions
  FOR SELECT USING (
    auth.uid() = (
      SELECT user_id FROM billing_customers WHERE id = billing_customer_id
    )
  );


