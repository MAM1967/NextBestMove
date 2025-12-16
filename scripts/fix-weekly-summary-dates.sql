-- Fix weekly summary dates: Delete summaries with incorrect week_start_date
-- This script removes summaries that were created with the old Monday-based calculation
-- Users can regenerate them using the "Generate Review" button which now uses the correct Sunday-Saturday week logic

-- First, let's see what summaries exist with potentially wrong dates
-- (This is a read-only query for inspection)
-- SELECT 
--   id,
--   user_id,
--   week_start_date,
--   generated_at,
--   (SELECT email FROM auth.users WHERE id = user_id) as user_email
-- FROM weekly_summaries
-- WHERE week_start_date < '2025-12-07'
-- ORDER BY week_start_date DESC;

-- Delete summaries with week_start_date before Dec 7, 2025
-- (These were likely generated with the old Monday-based calculation)
-- Note: This will also delete associated content_prompts due to CASCADE
DELETE FROM weekly_summaries
WHERE week_start_date < '2025-12-07';

-- After running this, users can regenerate their summaries using the "Generate Review" button
-- which now correctly calculates the previous week's Sunday (Dec 7-13 for week ending Dec 13)

