-- Verification script for pins → leads migration
-- Run this after the migration to verify everything is working correctly

-- ============================================
-- 1. Verify Table Rename
-- ============================================
SELECT 
  'Table rename check' as test_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leads')
    THEN '✅ PASS: leads table exists'
    ELSE '❌ FAIL: leads table does not exist'
  END as result;

SELECT 
  'Old table removed check' as test_name,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'person_pins')
    THEN '✅ PASS: person_pins table removed'
    ELSE '❌ FAIL: person_pins table still exists'
  END as result;

-- ============================================
-- 2. Verify Enum Rename
-- ============================================
SELECT 
  'Enum rename check' as test_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status')
    THEN '✅ PASS: lead_status enum exists'
    ELSE '❌ FAIL: lead_status enum does not exist'
  END as result;

SELECT 
  'Old enum removed check' as test_name,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pin_status')
    THEN '✅ PASS: pin_status enum removed'
    ELSE '❌ FAIL: pin_status enum still exists'
  END as result;

-- Check enum values
SELECT 
  'Enum values check' as test_name,
  string_agg(enumlabel, ', ' ORDER BY enumsortorder) as enum_values
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'lead_status';

-- ============================================
-- 3. Verify Indexes
-- ============================================
SELECT 
  'Indexes check' as test_name,
  indexname,
  CASE 
    WHEN indexname LIKE 'idx_leads%' THEN '✅ PASS'
    ELSE '⚠️ WARNING: Unexpected index name'
  END as status
FROM pg_indexes
WHERE tablename = 'leads'
ORDER BY indexname;

-- Expected indexes:
-- idx_leads_user_id
-- idx_leads_status
-- idx_leads_user_status
-- idx_leads_snooze_until

-- ============================================
-- 4. Verify Foreign Keys
-- ============================================
SELECT 
  'Foreign keys check' as test_name,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  CASE 
    WHEN ccu.table_name = 'leads' THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'leads'
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================
-- 5. Verify RLS Policies
-- ============================================
SELECT 
  'RLS policies check' as test_name,
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN policyname LIKE '%lead%' THEN '✅ PASS'
    ELSE '⚠️ WARNING: Policy name may need update'
  END as status
FROM pg_policies
WHERE tablename = 'leads'
ORDER BY policyname;

-- ============================================
-- 6. Verify Triggers
-- ============================================
SELECT 
  'Triggers check' as test_name,
  trigger_name,
  event_manipulation,
  CASE 
    WHEN trigger_name LIKE '%lead%' THEN '✅ PASS'
    ELSE '⚠️ WARNING: Trigger name may need update'
  END as status
FROM information_schema.triggers
WHERE event_object_table = 'leads'
ORDER BY trigger_name;

-- ============================================
-- 7. Verify Functions
-- ============================================
-- Check auto_unsnooze_items function
SELECT 
  'Function check: auto_unsnooze_items' as test_name,
  CASE 
    WHEN pg_get_functiondef(oid) LIKE '%leads%' 
      AND NOT (pg_get_functiondef(oid) LIKE '%person_pins%')
    THEN '✅ PASS: Function references leads table'
    ELSE '❌ FAIL: Function may still reference person_pins'
  END as result
FROM pg_proc
WHERE proname = 'auto_unsnooze_items';

-- Check detect_warm_reengagement_pattern function
SELECT 
  'Function check: detect_warm_reengagement_pattern' as test_name,
  CASE 
    WHEN pg_get_functiondef(oid) LIKE '%leads%' 
      AND NOT (pg_get_functiondef(oid) LIKE '%person_pins%')
    THEN '✅ PASS: Function references leads table'
    ELSE '❌ FAIL: Function may still reference person_pins'
  END as result
FROM pg_proc
WHERE proname = 'detect_warm_reengagement_pattern';

-- ============================================
-- 8. Data Integrity Checks
-- ============================================
-- Count records in leads table
SELECT 
  'Data count check' as test_name,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_leads,
  COUNT(*) FILTER (WHERE status = 'SNOOZED') as snoozed_leads,
  COUNT(*) FILTER (WHERE status = 'ARCHIVED') as archived_leads
FROM leads;

-- Check that actions still reference leads correctly
SELECT 
  'Actions foreign key check' as test_name,
  COUNT(*) as total_actions,
  COUNT(*) FILTER (WHERE person_id IS NOT NULL) as actions_with_lead,
  COUNT(*) FILTER (WHERE person_id IS NULL) as actions_without_lead
FROM actions;

-- Verify foreign key integrity
SELECT 
  'Foreign key integrity check' as test_name,
  COUNT(*) as orphaned_actions
FROM actions a
WHERE a.person_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM leads l WHERE l.id = a.person_id
  );

-- Check pre_call_briefs foreign key
SELECT 
  'Pre-call briefs foreign key check' as test_name,
  COUNT(*) as total_briefs,
  COUNT(*) FILTER (WHERE person_pin_id IS NOT NULL) as briefs_with_lead,
  COUNT(*) FILTER (WHERE person_pin_id IS NULL) as briefs_without_lead
FROM pre_call_briefs;

-- Verify foreign key integrity for pre_call_briefs
SELECT 
  'Pre-call briefs foreign key integrity check' as test_name,
  COUNT(*) as orphaned_briefs
FROM pre_call_briefs pcb
WHERE pcb.person_pin_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM leads l WHERE l.id = pcb.person_pin_id
  );

-- ============================================
-- 9. Test Basic Operations
-- ============================================
-- Test SELECT (should work with RLS)
SELECT 
  'RLS SELECT test' as test_name,
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ PASS: Can query leads table'
    ELSE '❌ FAIL: Cannot query leads table'
  END as result
FROM leads
LIMIT 1;

-- Test that status enum values work
SELECT 
  'Status enum test' as test_name,
  status,
  COUNT(*) as count
FROM leads
GROUP BY status
ORDER BY status;

-- ============================================
-- 10. Summary Report
-- ============================================
SELECT 
  '=== MIGRATION VERIFICATION SUMMARY ===' as summary;

SELECT 
  'Table exists' as check_item,
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'leads') THEN '✅' ELSE '❌' END as status
UNION ALL
SELECT 
  'Enum exists',
  CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN '✅' ELSE '❌' END
UNION ALL
SELECT 
  'Indexes renamed',
  CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'leads' AND indexname = 'idx_leads_user_id') THEN '✅' ELSE '❌' END
UNION ALL
SELECT 
  'RLS policies updated',
  CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname LIKE '%lead%') THEN '✅' ELSE '❌' END
UNION ALL
SELECT 
  'Functions updated',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'auto_unsnooze_items' 
        AND pg_get_functiondef(oid) LIKE '%leads%'
    ) THEN '✅' ELSE '❌' 
  END
UNION ALL
SELECT 
  'Foreign keys working',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'leads'
    ) THEN '✅' ELSE '❌' 
  END;

