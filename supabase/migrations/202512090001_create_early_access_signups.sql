-- Create early_access_signups table for marketing pre-launch signups
-- Created: December 9, 2025

CREATE TABLE IF NOT EXISTS early_access_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  linkedin_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('fractional_cmo', 'agency', 'consultant', 'other')),
  active_clients_count INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'invited', 'declined')),
  invited_at TIMESTAMPTZ,
  invited_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_early_access_signups_email ON early_access_signups(email);
CREATE INDEX IF NOT EXISTS idx_early_access_signups_status ON early_access_signups(status);
CREATE INDEX IF NOT EXISTS idx_early_access_signups_created_at ON early_access_signups(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_early_access_signups_updated_at
  BEFORE UPDATE ON early_access_signups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: Only service role can read/write (admin access via API routes)
-- Public can insert (for form submissions)
ALTER TABLE early_access_signups ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access" ON early_access_signups
  FOR ALL USING (auth.role() = 'service_role');

-- Public can insert (for form submissions)
CREATE POLICY "Public can insert early access signups" ON early_access_signups
  FOR INSERT WITH CHECK (true);

-- Public cannot read (privacy - only admins can see signups)
-- Admins will use Supabase dashboard with service role

