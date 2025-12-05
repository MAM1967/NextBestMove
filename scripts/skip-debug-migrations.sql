-- Skip debug/verification migrations in staging
-- These are diagnostic queries, not required for functionality

INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES 
  ('202501270007', '202501270007_debug_stale_actions', '{}'),
  ('202501270008', '202501270008_verify_stale_actions', '{}'),
  ('202501270009', '202501270009_debug_stale_actions_query', '{}'),
  ('202501270010', '202501270010_find_stale_test_actions', '{}'),
  ('202501270012', '202501270012_check_old_actions', '{}'),
  ('202501280004', '202501280004_verify_byok_setup', '{}'),
  ('202501280005', '202501280005_check_byok_columns', '{}'),
  ('202501280008', '202501280008_check_tables', '{}')
ON CONFLICT (version) DO NOTHING;

-- These are debug/verification migrations and can be safely skipped

