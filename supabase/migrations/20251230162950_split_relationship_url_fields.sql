-- Split relationship url field into separate fields: linkedin_url, email, phone_number
-- This allows users to track multiple contact methods per relationship
-- Signals will use email and LinkedIn to monitor relationships

-- Add new fields
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Migrate existing data from url field
-- If url starts with mailto:, extract email
UPDATE leads
SET email = SUBSTRING(url FROM 8) -- Remove 'mailto:' prefix
WHERE url LIKE 'mailto:%' AND email IS NULL;

-- If url contains linkedin.com, move to linkedin_url
UPDATE leads
SET linkedin_url = url
WHERE (url LIKE '%linkedin.com%' OR url LIKE '%linkedin.com/in/%')
  AND linkedin_url IS NULL;

-- For other URLs (CRM links, etc.), keep in url field for now
-- url field will remain for backward compatibility and non-LinkedIn URLs

-- Make url nullable (since we now have separate fields)
-- But keep NOT NULL constraint for now to ensure at least one contact method
-- We'll handle validation at the application level

-- Add indexes for email matching (used by signals)
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_linkedin_url ON leads(linkedin_url) WHERE linkedin_url IS NOT NULL;

-- Add comments
COMMENT ON COLUMN leads.linkedin_url IS 'LinkedIn profile URL for this relationship. Used by signals to monitor LinkedIn activity.';
COMMENT ON COLUMN leads.email IS 'Email address for this relationship. Used by signals to monitor email communications.';
COMMENT ON COLUMN leads.phone_number IS 'Phone number for SMS communication (future feature).';
COMMENT ON COLUMN leads.url IS 'Legacy field: LinkedIn URL, CRM link, or mailto: email. Kept for backward compatibility. New relationships should use linkedin_url and email fields instead.';

