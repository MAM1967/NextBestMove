# NextBestMove Database Schema

## Supabase PostgreSQL Schema v1.0

---

## Overview

This document defines the complete database schema for NextBestMove v0.1, including all domain models from the PRD plus calendar integration tables.

**Database:** PostgreSQL (via Supabase)  
**ORM/Client:** Supabase JS Client (optional: Prisma for type safety)

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Core Tables](#core-tables)
3. [Calendar Integration Tables](#calendar-integration-tables)
4. [Indexes](#indexes)
5. [Row Level Security (RLS)](#row-level-security-rls)
6. [Triggers & Functions](#triggers--functions)
7. [Migrations](#migrations)

---

## Schema Overview

### Tables

1. **users** - User accounts
2. **leads** - Leads/contacts
3. **actions** - Action items
4. **daily_plans** - Generated daily plans
5. **daily_plan_actions** - Junction table for daily plan actions
6. **weekly_summaries** - Weekly summary reports
7. **content_prompts** - Saved content prompts
8. **calendar_connections** - Calendar OAuth connections
9. **calendar_sync_logs** - Calendar sync audit log (optional)
10. **billing_customers** - Stripe customer mapping
11. **billing_subscriptions** - Subscription lifecycle tracking
12. **billing_events** - Stripe webhook audit log (optional)

### Enums

- `lead_status` - ACTIVE, SNOOZED, ARCHIVED
- `action_type` - OUTREACH, FOLLOW_UP, NURTURE, CALL_PREP, POST_CALL, CONTENT, FAST_WIN
- `action_state` - NEW, SENT, REPLIED, SNOOZED, DONE, ARCHIVED
- `calendar_provider` - google, outlook
- `calendar_connection_status` - active, expired, error, disconnected
- `capacity_level` - micro, light, standard, heavy, default
- `subscription_status` - trialing, active, past_due, canceled

---

## Core Tables

### 1. users

Stores user account information.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  calendar_connected BOOLEAN NOT NULL DEFAULT false,
  streak_count INTEGER NOT NULL DEFAULT 0,
  last_action_date DATE, -- Last date user completed an action (for streak calculation)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_last_action_date ON users(last_action_date);

-- Trigger to update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Fields:**

- `id`: UUID primary key
- `email`: Unique email address
- `name`: User's display name
- `timezone`: IANA timezone identifier (e.g., "America/New_York")
- `calendar_connected`: Boolean flag (denormalized from calendar_connections for quick checks)
- `streak_count`: Current consecutive days streak
- `last_action_date`: Last date user completed action (for streak calculation)
- `created_at`, `updated_at`: Timestamps

---

### 2. leads

Stores leads/contacts.

```sql
CREATE TYPE lead_status AS ENUM ('ACTIVE', 'SNOOZED', 'ARCHIVED');

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL, -- LinkedIn, CRM, or mailto link
  notes TEXT, -- Optional notes
  status lead_status NOT NULL DEFAULT 'ACTIVE',
  snooze_until DATE, -- If SNOOZED, when to unsnooze
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_url CHECK (
    url LIKE 'https://%' OR
    url LIKE 'http://%' OR
    url LIKE 'mailto:%'
  )
);

-- Indexes
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_user_status ON leads(user_id, status);
CREATE INDEX idx_leads_snooze_until ON leads(snooze_until) WHERE status = 'SNOOZED';

-- Trigger to update updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Fields:**

- `id`: UUID primary key
- `user_id`: Foreign key to users
- `name`: Person's name
- `url`: Primary URL (LinkedIn, CRM, or mailto link)
- `notes`: Optional notes/context
- `status`: Lead status (ACTIVE, SNOOZED, ARCHIVED)
- `snooze_until`: Date to automatically unsnooze (if SNOOZED)
- `created_at`, `updated_at`: Timestamps

---

### 3. actions

Stores action items.

```sql
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

CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  person_id UUID REFERENCES leads(id) ON DELETE SET NULL, -- Optional, not all actions tied to leads
  action_type action_type NOT NULL,
  state action_state NOT NULL DEFAULT 'NEW',
  description TEXT, -- Auto-generated or user-provided description
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ, -- When action was marked as done
  snooze_until DATE, -- If SNOOZED, when to unsnooze
  notes TEXT, -- Optional user notes (e.g., "asked to talk in March")
  auto_created BOOLEAN NOT NULL DEFAULT false, -- System-generated vs user-created
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_due_date CHECK (due_date >= DATE(created_at))
);

-- Indexes
CREATE INDEX idx_actions_user_id ON actions(user_id);
CREATE INDEX idx_actions_person_id ON actions(person_id);
CREATE INDEX idx_actions_state ON actions(state);
CREATE INDEX idx_actions_due_date ON actions(due_date);
CREATE INDEX idx_actions_user_state_due ON actions(user_id, state, due_date);
CREATE INDEX idx_actions_snooze_until ON actions(snooze_until) WHERE state = 'SNOOZED';

-- Trigger to update updated_at
CREATE TRIGGER update_actions_updated_at
  BEFORE UPDATE ON actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-unsnooze pins and actions
CREATE OR REPLACE FUNCTION auto_unsnooze_items()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-unsnooze leads
  UPDATE leads
  SET status = 'ACTIVE', snooze_until = NULL
  WHERE status = 'SNOOZED'
    AND snooze_until IS NOT NULL
    AND snooze_until <= CURRENT_DATE;

  -- Auto-unsnooze actions
  UPDATE actions
  SET state = 'NEW', snooze_until = NULL
  WHERE state = 'SNOOZED'
    AND snooze_until IS NOT NULL
    AND snooze_until <= CURRENT_DATE;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Run daily (via cron job or scheduled function)
CREATE TRIGGER check_snooze_dates
  AFTER INSERT OR UPDATE ON actions
  FOR EACH ROW
  WHEN (NEW.snooze_until IS NOT NULL)
  EXECUTE FUNCTION auto_unsnooze_items();
```

**Fields:**

- `id`: UUID primary key
- `user_id`: Foreign key to users
- `person_id`: Optional foreign key to leads
- `action_type`: Type of action
- `state`: Current state of action
- `description`: Action description
- `due_date`: Date action is due
- `completed_at`: Timestamp when completed
- `snooze_until`: Date to automatically unsnooze
- `notes`: Optional user notes
- `auto_created`: Whether system-generated
- `created_at`, `updated_at`: Timestamps

---

### 4. daily_plans

Stores generated daily plans.

```sql
CREATE TYPE capacity_level AS ENUM ('micro', 'light', 'standard', 'heavy', 'default');

CREATE TABLE daily_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  focus_statement TEXT, -- Weekly focus statement for context
  capacity capacity_level NOT NULL DEFAULT 'default',
  free_minutes INTEGER, -- Free minutes calculated from calendar (if available)
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, date) -- One plan per user per day
);

-- Indexes
CREATE INDEX idx_daily_plans_user_id ON daily_plans(user_id);
CREATE INDEX idx_daily_plans_date ON daily_plans(date);
CREATE INDEX idx_daily_plans_user_date ON daily_plans(user_id, date);

-- Trigger to update updated_at
CREATE TRIGGER update_daily_plans_updated_at
  BEFORE UPDATE ON daily_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Fields:**

- `id`: UUID primary key
- `user_id`: Foreign key to users
- `date`: Date of the plan (YYYY-MM-DD)
- `focus_statement`: Weekly focus statement for context
- `capacity`: Capacity level determined from calendar
- `free_minutes`: Free minutes calculated (nullable if no calendar)
- `generated_at`: When plan was generated
- `created_at`, `updated_at`: Timestamps

---

### 5. daily_plan_actions

Junction table linking daily plans to actions (ordered list).

```sql
CREATE TABLE daily_plan_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_plan_id UUID NOT NULL REFERENCES daily_plans(id) ON DELETE CASCADE,
  action_id UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, -- Order in the plan (0 = Fast Win, 1+ = regular actions)
  is_fast_win BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(daily_plan_id, action_id),
  UNIQUE(daily_plan_id, position) -- Ensure one action per position
);

-- Indexes
CREATE INDEX idx_daily_plan_actions_daily_plan_id ON daily_plan_actions(daily_plan_id);
CREATE INDEX idx_daily_plan_actions_action_id ON daily_plan_actions(action_id);
CREATE INDEX idx_daily_plan_actions_position ON daily_plan_actions(daily_plan_id, position);
```

**Fields:**

- `id`: UUID primary key
- `daily_plan_id`: Foreign key to daily_plans
- `action_id`: Foreign key to actions
- `position`: Order in plan (0 = Fast Win)
- `is_fast_win`: Boolean flag for Fast Win actions
- `created_at`: Timestamp

---

### 6. weekly_summaries

Stores weekly summary reports.

```sql
CREATE TABLE weekly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL, -- Monday of the week
  days_active INTEGER NOT NULL DEFAULT 0,
  actions_completed INTEGER NOT NULL DEFAULT 0,
  replies INTEGER NOT NULL DEFAULT 0, -- User-marked replies
  calls_booked INTEGER NOT NULL DEFAULT 0, -- User-reported calls
  insight_text TEXT NOT NULL, -- AI-generated insight
  narrative_summary TEXT, -- 2-3 sentence narrative (AI-generated)
  next_week_focus TEXT NOT NULL, -- Suggested focus for next week
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, week_start_date) -- One summary per user per week
);

-- Indexes
CREATE INDEX idx_weekly_summaries_user_id ON weekly_summaries(user_id);
CREATE INDEX idx_weekly_summaries_week_start ON weekly_summaries(week_start_date);
CREATE INDEX idx_weekly_summaries_user_week ON weekly_summaries(user_id, week_start_date DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_weekly_summaries_updated_at
  BEFORE UPDATE ON weekly_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Fields:**

- `id`: UUID primary key
- `user_id`: Foreign key to users
- `week_start_date`: Monday of the week (YYYY-MM-DD)
- `days_active`: Number of days user was active
- `actions_completed`: Total actions completed
- `replies`: Number of replies received (user-marked)
- `calls_booked`: Number of calls booked (user-reported)
- `insight_text`: AI-generated insight
- `narrative_summary`: AI-generated narrative
- `next_week_focus`: Suggested focus for next week
- `generated_at`: When summary was generated
- `created_at`, `updated_at`: Timestamps

---

### 7. content_prompts

Stores saved content prompts from weekly summaries.

```sql
CREATE TYPE content_prompt_type AS ENUM ('WIN_POST', 'INSIGHT_POST');

CREATE TYPE content_prompt_status AS ENUM ('DRAFT', 'POSTED', 'ARCHIVED');

CREATE TABLE content_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weekly_summary_id UUID REFERENCES weekly_summaries(id) ON DELETE SET NULL, -- Optional reference
  type content_prompt_type NOT NULL,
  content TEXT NOT NULL, -- The prompt/draft content
  status content_prompt_status NOT NULL DEFAULT 'DRAFT',
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_content_prompts_user_id ON content_prompts(user_id);
CREATE INDEX idx_content_prompts_status ON content_prompts(status);
CREATE INDEX idx_content_prompts_user_status ON content_prompts(user_id, status);

-- Trigger to update updated_at
CREATE TRIGGER update_content_prompts_updated_at
  BEFORE UPDATE ON content_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Fields:**

- `id`: UUID primary key
- `user_id`: Foreign key to users
- `weekly_summary_id`: Optional reference to weekly summary
- `type`: Type of content prompt
- `content`: The prompt/draft content
- `status`: Current status (DRAFT, POSTED, ARCHIVED)
- `saved_at`: When user saved it
- `created_at`, `updated_at`: Timestamps

---

## Calendar Integration Tables

### 8. calendar_connections

Stores OAuth connections to Google/Outlook calendars.

```sql
CREATE TYPE calendar_provider AS ENUM ('google', 'outlook');

CREATE TYPE calendar_connection_status AS ENUM ('active', 'expired', 'error', 'disconnected');

CREATE TABLE calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider calendar_provider NOT NULL,
  refresh_token TEXT NOT NULL, -- Encrypted refresh token
  access_token TEXT, -- Encrypted access token (temporary)
  expires_at INTEGER, -- Unix timestamp when access_token expires
  calendar_id TEXT NOT NULL, -- Provider's calendar identifier (e.g., "primary")
  status calendar_connection_status NOT NULL DEFAULT 'active',
  last_sync_at TIMESTAMPTZ, -- Last successful sync
  error_message TEXT, -- Last error message if status is 'error'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, provider) -- One connection per provider per user
);

-- Indexes
CREATE INDEX idx_calendar_connections_user_id ON calendar_connections(user_id);
CREATE INDEX idx_calendar_connections_provider ON calendar_connections(provider);
CREATE INDEX idx_calendar_connections_status ON calendar_connections(status);
CREATE INDEX idx_calendar_connections_user_status ON calendar_connections(user_id, status);

-- Trigger to update users.calendar_connected when connection changes
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

-- Trigger to update updated_at
CREATE TRIGGER update_calendar_connections_updated_at
  BEFORE UPDATE ON calendar_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Fields:**

- `id`: UUID primary key
- `user_id`: Foreign key to users
- `provider`: Calendar provider (google or outlook)
- `refresh_token`: Encrypted refresh token
- `access_token`: Encrypted access token (temporary, nullable)
- `expires_at`: Unix timestamp when access token expires
- `calendar_id`: Provider's calendar identifier
- `status`: Connection status
- `last_sync_at`: Last successful sync timestamp
- `error_message`: Last error if status is 'error'
- `created_at`, `updated_at`: Timestamps

**Security Note:** Tokens should be encrypted at application level before storing. Consider using Supabase Vault or application-level encryption.

---

### 9. calendar_sync_logs (Optional)

Audit log for calendar sync operations (useful for debugging).

```sql
CREATE TABLE calendar_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_connection_id UUID NOT NULL REFERENCES calendar_connections(id) ON DELETE CASCADE,
  operation TEXT NOT NULL, -- 'sync', 'refresh_token', 'fetch_freebusy'
  status TEXT NOT NULL, -- 'success', 'error'
  error_message TEXT,
  metadata JSONB, -- Additional context (request params, response data, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_calendar_sync_logs_connection_id ON calendar_sync_logs(calendar_connection_id);
CREATE INDEX idx_calendar_sync_logs_created_at ON calendar_sync_logs(created_at DESC);
CREATE INDEX idx_calendar_sync_logs_status ON calendar_sync_logs(status);

-- Retention policy: Keep logs for 90 days
-- Can be implemented via cron job or scheduled cleanup
```

**Fields:**

- `id`: UUID primary key
- `calendar_connection_id`: Foreign key to calendar_connections
- `operation`: Type of operation performed
- `status`: Success or error status
- `error_message`: Error details if failed
- `metadata`: JSON metadata for debugging
- `created_at`: Timestamp

---

### 10. billing_customers

Maps each user to a Stripe customer object.

```sql
CREATE TABLE billing_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  default_payment_method TEXT,
  currency TEXT NOT NULL DEFAULT 'usd',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_billing_customers_user_id ON billing_customers(user_id);

CREATE TRIGGER update_billing_customers_updated_at
  BEFORE UPDATE ON billing_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Fields:**

- `user_id`: One-to-one relationship with users table
- `stripe_customer_id`: Stripe-generated ID (`cus_...`)
- `default_payment_method`: Optional default payment method ID
- `currency`: Stored for display/reference

---

### 11. billing_subscriptions

Tracks subscription status pulled from Stripe webhooks.

```sql
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled');

CREATE TABLE billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_customer_id UUID NOT NULL REFERENCES billing_customers(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT NOT NULL,
  status subscription_status NOT NULL DEFAULT 'trialing',
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  trial_ends_at TIMESTAMPTZ,
  latest_invoice_url TEXT,
  metadata JSONB, -- copy of plan nickname, amount, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_billing_subscriptions_customer ON billing_subscriptions(billing_customer_id);
CREATE INDEX idx_billing_subscriptions_status ON billing_subscriptions(status);

CREATE TRIGGER update_billing_subscriptions_updated_at
  BEFORE UPDATE ON billing_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Fields:**

- `billing_customer_id`: Foreign key to billing_customers
- `stripe_subscription_id`: Stripe subscription identifier (`sub_...`)
- `stripe_price_id`: Price/plan reference
- `status`: Mirrors Stripe status for gating (trialing, active, etc.)
- `current_period_end`: Used to show renewal/grace date
- `cancel_at_period_end`: Controls UI copy for pending cancellations
- `metadata`: Cached plan nickname/amount to render paywall without hitting Stripe

---

### 12. billing_events (Optional)

Stores raw webhook payloads for auditing/idempotency.

```sql
CREATE TABLE billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_billing_events_type ON billing_events(type);
CREATE INDEX idx_billing_events_created_at ON billing_events(created_at DESC);
```

**Fields:**

- `stripe_event_id`: Stripe event identifier
- `type`: Event type (e.g., `checkout.session.completed`)
- `payload`: Raw JSON body (after signature verification)
- `processed_at`: Timestamp when business logic completed

---

## Helper Functions

### Update Updated At Column

Generic function to update `updated_at` timestamp:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### Auto-Archive Old Actions

Archive actions in DONE state older than 90 days (per PRD Section 18):

```sql
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

-- Run daily via cron job or scheduled function
-- Example: SELECT cron.schedule('auto-archive-actions', '0 2 * * *', 'SELECT auto_archive_old_actions()');
```

---

### Calculate User Streak

Function to recalculate user streak count:

```sql
CREATE OR REPLACE FUNCTION calculate_user_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  streak_count INTEGER := 0;
  check_date DATE := CURRENT_DATE;
BEGIN
  -- Count consecutive days with completed actions, starting from today
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

-- Update streak count for a user
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
```

---

## Indexes Summary

### Performance-Critical Indexes

1. **User data queries:**

   - `users.email` - For authentication lookups
   - `leads(user_id, status)` - Filter leads by user and status
   - `actions(user_id, state, due_date)` - Daily plan generation queries

2. **Daily plan queries:**

   - `daily_plans(user_id, date)` - Fetch today's plan
   - `daily_plan_actions(daily_plan_id, position)` - Ordered action list

3. **Weekly summary queries:**

   - `weekly_summaries(user_id, week_start_date DESC)` - Recent summaries

4. **Calendar queries:**
   - `calendar_connections(user_id, status)` - Active connections

---

## Row Level Security (RLS)

Enable RLS on all tables to ensure users can only access their own data:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plan_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_subscriptions ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user ID (via Supabase auth)
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID AS $$
  SELECT auth.uid()::UUID;
$$ LANGUAGE sql STABLE;

-- Policy: Users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own leads" ON leads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own leads" ON leads
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

-- Billing records are generally mutated server-side via service role.

CREATE POLICY "Users can view own subscriptions" ON billing_subscriptions
  FOR SELECT USING (
    auth.uid() = (
      SELECT user_id FROM billing_customers WHERE id = billing_customer_id
    )
  );
```

**Note:** Adjust RLS policies based on your Supabase auth setup. The `auth.uid()` function may need to be adapted to your authentication implementation.

---

## Triggers & Functions Summary

1. **Auto-update timestamps:** `update_updated_at_column()` on all tables
2. **Update calendar_connected flag:** `update_user_calendar_status()` when connections change
3. **Auto-unsnooze items:** `auto_unsnooze_items()` - Run daily via cron
4. **Auto-archive old actions:** `auto_archive_old_actions()` - Run daily via cron
5. **Calculate streak:** `calculate_user_streak()` and `update_user_streak()`

---

## Migrations

### Initial Migration Structure

```sql
-- migration_001_initial_schema.sql

-- Create enums
CREATE TYPE pin_status AS ENUM ('ACTIVE', 'SNOOZED', 'ARCHIVED');
CREATE TYPE action_type AS ENUM (...);
CREATE TYPE action_state AS ENUM (...);
-- ... all enums

-- Create helper functions
CREATE OR REPLACE FUNCTION update_updated_at_column() ...;
-- ... all helper functions

-- Create tables (in dependency order)
CREATE TABLE users (...);
CREATE TABLE person_pins (...);
-- ... all tables

-- Create indexes
CREATE INDEX ...;
-- ... all indexes

-- Create triggers
CREATE TRIGGER ...;
-- ... all triggers

-- Enable RLS
ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
-- ... all RLS policies
```

---

## Security Considerations

### Token Encryption

Calendar tokens should be encrypted before storage:

1. **Application-level encryption** (recommended):

   - Encrypt tokens in application code before storing
   - Use environment variable for encryption key
   - Use AES-256-GCM encryption

2. **Supabase Vault** (alternative):
   - Use Supabase Vault for sensitive data
   - Automatic encryption at rest

### Password Hashing

User passwords handled by Supabase Auth (not stored in `users` table).

### Stripe Secrets

- Store Stripe secret key + webhook signing secret outside database (environment variables).
- Webhook handler should verify signatures and log payloads in `billing_events`.
- Never expose Stripe customer/subscription IDs directly to the client without auth checks.

### Data Retention

Per PRD Section 18:

- Actions in DONE state: Archive after 90 days
- ARCHIVED items: Retained indefinitely
- Weekly summaries: Retained indefinitely

---

## Next Steps

1. ✅ Database schema defined
2. ⏳ Create migration files
3. ⏳ Set up RLS policies
4. ⏳ Implement encryption for tokens
5. ⏳ Create database seeding scripts (optional)
6. ⏳ Set up scheduled jobs (auto-archive, auto-unsnooze)

---

_Database Schema v1.0 - Ready for implementation_
