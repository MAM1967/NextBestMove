-- Create tasks table for NextBestMove dashboard demo
-- This is a simplified table for initial development/testing

-- Helper function to keep updated_at fresh (if it doesn't already exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- Add updated_at trigger (drop first if it exists to make migration idempotent)
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- For now, allow public read access (you can tighten this later with auth)
-- This allows the dashboard to work without authentication initially
DROP POLICY IF EXISTS "Allow public read access to tasks" ON tasks;
CREATE POLICY "Allow public read access to tasks" ON tasks
  FOR SELECT USING (true);

-- Insert some sample data for testing
INSERT INTO tasks (title, status) VALUES
  ('Set up Supabase connection', 'done'),
  ('Create tasks table migration', 'done'),
  ('Build dashboard UI', 'in_progress'),
  ('Add authentication', 'pending'),
  ('Integrate calendar API', 'pending')
ON CONFLICT DO NOTHING;

