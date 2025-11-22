-- Quick verification that migration 017 worked
-- Run this to confirm everything was created

-- 1. Check if companies table exists
SELECT 
  'Companies Table' as check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- 2. Check if generate_company_slug function exists
SELECT 
  'Slug Function' as check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_company_slug')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- 3. Test the slug function
SELECT 
  'Function Test' as check_item,
  generate_company_slug('Ace Recovery Services') as generated_slug,
  '✅ WORKS' as status;

-- 4. Check RLS is enabled
SELECT 
  'RLS Enabled' as check_item,
  CASE 
    WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'companies' AND schemaname = 'public')
    THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as status;

-- 5. Check policies exist
SELECT 
  'RLS Policies' as check_item,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ POLICIES EXIST'
    ELSE '⚠️ FEW POLICIES'
  END as status
FROM pg_policies
WHERE tablename = 'companies';

-- 6. Summary
SELECT 
  '📊 SUMMARY' as report,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'companies') as tables_created,
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'generate_company_slug') as functions_created,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'companies') as policies_created;


