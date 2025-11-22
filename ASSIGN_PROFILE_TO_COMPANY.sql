-- Assign Profile to Company - Ready to Run
-- This script will:
-- 1. Check if companies exist
-- 2. Create a default company if none exist
-- 3. Assign the unassigned profile to that company
-- 4. Verify the assignment

-- ============================================
-- STEP 1: Check Current State
-- ============================================
SELECT 
  'Current State' as info,
  (SELECT COUNT(*) FROM companies) as companies_count,
  (SELECT COUNT(*) FROM profiles WHERE company_id IS NULL) as unassigned_profiles;

-- ============================================
-- STEP 2: Create Default Company (if needed)
-- ============================================
-- This will only create if no companies exist
-- Uses email from first profile, or a default email
INSERT INTO companies (
  name,
  slug,
  email,
  status,
  plan,
  primary_color,
  settings
)
SELECT 
  'Default Company',
  'default-company',
  COALESCE(
    (SELECT email FROM profiles ORDER BY created_at LIMIT 1),
    'admin@default-company.com'
  ),
  'active',
  'enterprise',
  '#3b82f6',
  '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM companies)
RETURNING id, name, slug, email;

-- ============================================
-- STEP 3: Assign Profile to Company
-- ============================================
-- Assign all profiles without company_id to the first company
UPDATE profiles
SET company_id = (
  SELECT id FROM companies ORDER BY created_at LIMIT 1
)
WHERE company_id IS NULL
RETURNING 
  id,
  email,
  full_name,
  company_id,
  '✅ ASSIGNED' as status;

-- ============================================
-- STEP 4: Final Verification
-- ============================================
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

-- Show company and profile details
SELECT 
  c.name as company_name,
  c.slug as company_slug,
  COUNT(p.id) as profile_count,
  STRING_AGG(p.email, ', ') as profile_emails
FROM companies c
LEFT JOIN profiles p ON p.company_id = c.id
GROUP BY c.id, c.name, c.slug
ORDER BY profile_count DESC;

