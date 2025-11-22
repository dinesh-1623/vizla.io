-- Verify that enum values were added successfully
-- Run this to check if super_admin and company_admin exist

-- Check current enum values
SELECT 
  'Current user_role enum values' as check_type,
  enumlabel as enum_value,
  enumsortorder as sort_order
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

-- Check specifically for new values
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'super_admin' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN '✅ super_admin EXISTS'
    ELSE '❌ super_admin MISSING - Run ADD_ENUM_VALUES_FIRST.sql'
  END as super_admin_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'company_admin' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN '✅ company_admin EXISTS'
    ELSE '❌ company_admin MISSING - Run ADD_ENUM_VALUES_FIRST.sql'
  END as company_admin_status;


