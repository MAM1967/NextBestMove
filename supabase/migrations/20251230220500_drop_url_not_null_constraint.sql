-- Drop NOT NULL constraint on url column
-- This allows url to be null when using the new separate contact fields
-- (linkedin_url, email, phone_number)

ALTER TABLE leads
  ALTER COLUMN url DROP NOT NULL;

-- Add a check constraint to ensure at least one contact method is present
-- This replaces the NOT NULL constraint on url with a more flexible validation
ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS chk_at_least_one_contact_method;

ALTER TABLE leads
  ADD CONSTRAINT chk_at_least_one_contact_method
  CHECK (
    (url IS NOT NULL AND url != '') OR
    (linkedin_url IS NOT NULL AND linkedin_url != '') OR
    (email IS NOT NULL AND email != '') OR
    (phone_number IS NOT NULL AND phone_number != '')
  );

-- Update comment to reflect that url is now nullable
COMMENT ON COLUMN leads.url IS 'Legacy field: LinkedIn URL, CRM link, or mailto: email. Now nullable - use linkedin_url and email fields for new relationships.';

