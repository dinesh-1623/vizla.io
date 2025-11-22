🚨 START HERE: Run migration 017_multi_tenancy_companies.sql first!-- Check Which Migrations Have Been Applied
-- Run this FIRST to see what's missing

-- ============================================
-- MIGRATION STATUS CHECK
-- ============================================

-- Check 1: Companies table (Migration 017)
SELECT 
  'Migration 017: Companies Table' as migration,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies')
      THEN '✅ APPLIED'
    ELSE '❌ NOT APPLIED - Run 017_multi_tenancy_companies.sql'
  END as status;

-- Check 2: Users table updates (Migration 018)
SELECT 
  'Migration 018: Users Table Updates' as migration,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'company_id'
    )
      THEN '✅ APPLIED'
    ELSE '❌ NOT APPLIED - Run 018_multi_tenancy_users_update.sql'
  END as status;

-- Check 3: Company_id on tables (Migration 019)
SELECT 
  'Migration 019: Add company_id to tables' as migration,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'vehicles' AND column_name = 'company_id'
    )
      THEN '✅ APPLIED'
    ELSE '❌ NOT APPLIED - Run 019_multi_tenancy_add_company_id.sql'
  END as status;

-- Check 4: RLS Policies (Migration 020)
SELECT 
  'Migration 020: RLS Policies' as migration,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'companies' 
      AND policyname LIKE '%company%'
    )
      THEN '✅ APPLIED'
    ELSE '❌ NOT APPLIED - Run 020_multi_tenancy_rls_policies.sql'
  END as status;

-- Check 5: Invitations table (Migration 021)
SELECT 
  'Migration 021: Invitations Table' as migration,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invitations')
      THEN '✅ APPLIED'
    ELSE '❌ NOT APPLIED - Run 021_multi_tenancy_invitations.sql'
  END as status;

-- Check 6: Audit Logs (Migration 022)
SELECT 
  'Migration 022: Audit Logs Table' as migration,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs')
      THEN '✅ APPLIED'
    ELSE '❌ NOT APPLIED - Run 022_multi_tenancy_audit_logs.sql'
  END as status;

-- ============================================
-- SUMMARY
-- ============================================
SELECT 
  '📊 MIGRATION SUMMARY' as report,
  COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies')) as migration_017,
  COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'company_id')) as migration_018,
  COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'company_id')) as migration_019,
  COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname LIKE '%company%')) as migration_020,
  COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invitations')) as migration_021,
  COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs')) as migration_022
FROM (SELECT 1) as dummy;

-- ============================================
-- NEXT STEPS
-- ============================================
SELECT 
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies')
      THEN '🚨 START HERE: Run migration 017_multi_tenancy_companies.sql first!'
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'company_id')
      THEN '➡️ NEXT: Run migration 018_multi_tenancy_users_update.sql'
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'company_id')
      THEN '➡️ NEXT: Run migration 019_multi_tenancy_add_company_id.sql'
    WHEN NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname LIKE '%company%')
      THEN '➡️ NEXT: Run migration 020_multi_tenancy_rls_policies.sql'
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invitations')
      THEN '➡️ NEXT: Run migration 021_multi_tenancy_invitations.sql'
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs')
      THEN '➡️ NEXT: Run migration 022_multi_tenancy_audit_logs.sql'
    ELSE '✅ ALL MIGRATIONS APPLIED! You can now run QUICK_CHECK_MULTI_TENANCY.sql'
  END as next_action;

