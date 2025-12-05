-- Remove the manual entry for 202501270012_check_old_actions.sql
-- So the CLI can apply it naturally (it's just a SELECT query, safe to run)

DELETE FROM supabase_migrations.schema_migrations 
WHERE version = '202501270012';

-- This migration is just a SELECT query (no schema changes)
-- It's safe to let it run, or we can skip it entirely since it's just a debug query

