-- Quick Multi-Tenancy Health Check
-- Run this in Supabase Dashboard → SQL Editor to verify everything is set up

-- ============================================
-- 1. CHECK TABLES EXIST
-- ============================================
SELECT 
  'Tables Check' as check_type,
  table_name,
  CASE 
    WHEN table_name IN ('companies', 'invitations', 'audit_logs') THEN '✅ REQUIRED TABLE'
    ELSE 'ℹ️ OTHER TABLE'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('companies', 'invitations', 'audit_logs', 'profiles', 'vehicles')
ORDER BY table_name;

-- ============================================
-- 2. CHECK COMPANIES TABLE STRUCTURE
-- ============================================
SELECT 
  'Companies Table Columns' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'companies'
ORDER BY ordinal_position;

-- ============================================
-- 3. CHECK PROFILES TABLE HAS COMPANY_ID
-- ============================================
SELECT 
  'Profiles Table Columns' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' 
AND column_name IN ('company_id', 'role', 'status', 'permissions', 'invited_by')
ORDER BY column_name;

-- ============================================
-- 4. CHECK RLS IS ENABLED
-- ============================================
SELECT 
  'RLS Status' as check_type,
  tablename as table_name,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED - FIX THIS!'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('companies', 'profiles', 'vehicles', 'alerts', 'invitations', 'audit_logs')
ORDER BY tablename;

-- ============================================
-- 5. CHECK RLS POLICIES EXIST
-- ============================================
SELECT 
  'RLS Policies' as check_type,
  tablename,
  policyname,
  CASE 
    WHEN policyname LIKE '%company%' OR policyname LIKE '%isolation%' THEN '✅ COMPANY ISOLATION'
    ELSE 'ℹ️ OTHER POLICY'
  END as policy_type
FROM pg_policies
WHERE tablename IN ('companies', 'profiles', 'vehicles')
ORDER BY tablename, policyname;

-- ============================================
-- 6. CHECK HELPER FUNCTIONS EXIST
-- ============================================
SELECT 
  'Helper Functions' as check_type,
  proname as function_name,
  CASE 
    WHEN proname IN ('generate_company_slug', 'get_default_permissions', 'log_audit_event') 
    THEN '✅ EXISTS'
    ELSE 'ℹ️ OTHER FUNCTION'
  END as status
FROM pg_proc
WHERE proname IN ('generate_company_slug', 'get_default_permissions', 'log_audit_event', 'set_user_permissions')
ORDER BY proname;

-- ============================================
-- 7. TEST HELPER FUNCTIONS
-- ============================================
-- Test slug generation (only if function exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_company_slug') THEN
    PERFORM generate_company_slug('Ace Recovery Services');
    RAISE NOTICE '✅ Slug generation function works';
  ELSE
    RAISE NOTICE '❌ Slug generation function missing - Run migration 017';
  END IF;
END $$;

-- Test permissions function (only if function exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_default_permissions') THEN
    PERFORM get_default_permissions('company_admin');
    RAISE NOTICE '✅ Permissions function works';
  ELSE
    RAISE NOTICE '❌ Permissions function missing - Run migration 018';
  END IF;
END $$;

-- ============================================
-- 8. CHECK EXISTING DATA STATUS
-- ============================================
-- Check if any companies exist
SELECT 
  'Existing Companies' as check_type,
  COUNT(*) as company_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ COMPANIES EXIST'
    ELSE '⚠️ NO COMPANIES YET (expected for new setup)'
  END as status
FROM companies;

-- Check profiles with/without company_id
SELECT 
  'Profiles Company Assignment' as check_type,
  COUNT(*) FILTER (WHERE company_id IS NOT NULL) as profiles_with_company,
  COUNT(*) FILTER (WHERE company_id IS NULL) as profiles_without_company,
  CASE 
    WHEN COUNT(*) FILTER (WHERE company_id IS NULL) = 0 THEN '✅ ALL PROFILES ASSIGNED'
    ELSE '⚠️ SOME PROFILES NEED COMPANY_ID'
  END as status
FROM profiles;

-- ============================================
-- 9. SUMMARY REPORT
-- ============================================
SELECT 
  '📊 SUMMARY' as report_section,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('companies', 'invitations', 'audit_logs')) as required_tables_count,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true AND tablename IN ('companies', 'profiles', 'vehicles')) as tables_with_rls,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'companies') as companies_policies_count,
  (SELECT COUNT(*) FROM companies) as existing_companies,
  (SELECT COUNT(*) FROM profiles WHERE company_id IS NOT NULL) as profiles_with_company;

-- ============================================
-- 10. NEXT STEPS RECOMMENDATIONS
-- ============================================
SELECT 
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies')
      THEN '❌ CRITICAL: Run migration 017_multi_tenancy_companies.sql'
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_id')
      THEN '❌ CRITICAL: Run migration 018_multi_tenancy_users_update.sql'
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'companies' AND rowsecurity = false)
      THEN '⚠️ WARNING: RLS not enabled on companies table'
    WHEN EXISTS (SELECT 1 FROM profiles WHERE company_id IS NULL)
      THEN '⚠️ WARNING: Some profiles need company_id assignment'
    ELSE '✅ ALL CHECKS PASSED - Ready for next steps!'
  END as recommendation;

