-- Check if BYOK columns exist in users table
-- Run this first to verify the migration was applied

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN ('ai_provider', 'ai_api_key_encrypted', 'ai_model')
ORDER BY column_name;

-- If the above returns 0 rows, the migration hasn't been run yet
-- Run: supabase/migrations/202501280000_add_byok_fields.sql first


