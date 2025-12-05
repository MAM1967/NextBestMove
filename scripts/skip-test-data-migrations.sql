-- Skip test data migrations in staging
-- These migrations try to insert test data for users that don't exist yet
-- We'll mark them as applied so they're skipped

-- Mark test data migrations as already applied
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES 
  ('202501270003', '202501270003_insert_test_actions', '{}'),
  ('202501270006', '202501270006_insert_stale_test_actions', '{}'),
  ('202501270011', '202501270011_insert_stale_actions_direct', '{}'),
  ('202501280001', '202501280001_create_test_premium_user', '{}'),
  ('202501280002', '202501280002_create_premium_for_user', '{}'),
  ('202501310001', '202501310001_create_test_data_for_standard_user', '{}')
ON CONFLICT (version) DO NOTHING;

-- Note: These are test data migrations and can be safely skipped in staging
-- You can create test users later via the sign-up flow

