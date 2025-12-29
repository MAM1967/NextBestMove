-- Check what tables exist in public schema
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname IN ('public', 'auth')
ORDER BY schemaname, tablename;

-- Check if users table exists in public schema
SELECT 
  table_schema,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'users';

-- Check auth.users (this might not be directly queryable, but we can check if auth schema exists)
SELECT 
  schema_name
FROM information_schema.schemata
WHERE schema_name = 'auth';














