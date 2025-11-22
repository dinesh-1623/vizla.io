-- Backfill company_id for Existing Profiles
-- This script helps assign existing profiles to a company
-- 
-- OPTION 1: Create a default company and assign all profiles to it
-- OPTION 2: Manually assign profiles to specific companies
--
-- ⚠️ IMPORTANT: Review and modify this script based on your needs

-- ============================================
-- STEP 1: Check Current State
-- ============================================
SELECT 
  'Current Profiles Status' as check_type,
  COUNT(*) as total_profiles,
  COUNT(*) FILTER (WHERE company_id IS NOT NULL) as profiles_with_company,
  COUNT(*) FILTER (WHERE company_id IS NULL) as profiles_without_company
FROM profiles;

-- Show profiles without company_id
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
WHERE company_id IS NULL
ORDER BY created_at DESC;

-- ============================================
-- STEP 2: OPTION A - Create Default Company
-- ============================================
-- Uncomment and run this section if you want to create a default company
-- and assign all existing profiles to it

/*
-- Create a default company
INSERT INTO companies (
  name,
  slug,
  status,
  plan,
  primary_color,
  settings
) VALUES (
  'Default Company',
  'default-company',
  'active',
  'enterprise',
  '#3b82f6',
  '{}'::jsonb
)
ON CONFLICT (slug) DO NOTHING
RETURNING id, name, slug;

-- Get the default company ID (replace with actual ID from above)
-- Then assign all profiles without company_id to this company
UPDATE profiles
SET company_id = (
  SELECT id FROM companies WHERE slug = 'default-company' LIMIT 1
)
WHERE company_id IS NULL;

-- Verify the update
SELECT 
  'After Backfill' as check_type,
  COUNT(*) as total_profiles,
  COUNT(*) FILTER (WHERE company_id IS NOT NULL) as profiles_with_company,
  COUNT(*) FILTER (WHERE company_id IS NULL) as profiles_without_company
FROM profiles;
*/

-- ============================================
-- STEP 2: OPTION B - Manual Assignment
-- ============================================
-- Use this section to manually assign specific profiles to specific companies
-- 
-- First, list all companies:
SELECT id, name, slug FROM companies ORDER BY name;

-- Then, assign profiles to a company (replace UUIDs with actual values):
/*
UPDATE profiles
SET company_id = 'YOUR_COMPANY_UUID_HERE'
WHERE id = 'PROFILE_UUID_HERE';
*/

-- ============================================
-- STEP 3: Assign All Profiles to First Company
-- ============================================
-- Quick option: Assign all profiles to the first company in your database
-- ⚠️ Use with caution - only if you want all profiles in one company

/*
UPDATE profiles
SET company_id = (SELECT id FROM companies ORDER BY created_at LIMIT 1)
WHERE company_id IS NULL;
*/

-- ============================================
-- STEP 4: Verify After Backfill
-- ============================================
-- Run this after backfilling to verify everything is assigned

SELECT 
  'Final Status' as check_type,
  COUNT(*) as total_profiles,
  COUNT(*) FILTER (WHERE company_id IS NOT NULL) as profiles_with_company,
  COUNT(*) FILTER (WHERE company_id IS NULL) as profiles_without_company,
  CASE 
    WHEN COUNT(*) FILTER (WHERE company_id IS NULL) = 0 
    THEN '✅ ALL PROFILES ASSIGNED'
    ELSE '⚠️ SOME PROFILES STILL NEED COMPANY_ID'
  END as status
FROM profiles;

-- Show company distribution
SELECT 
  c.name as company_name,
  COUNT(p.id) as profile_count
FROM companies c
LEFT JOIN profiles p ON p.company_id = c.id
GROUP BY c.id, c.name
ORDER BY profile_count DESC;


