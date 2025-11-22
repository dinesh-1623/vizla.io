-- Quick Backfill: Assign All Profiles to First Company
-- ⚠️ WARNING: This assigns ALL profiles without company_id to the FIRST company
-- Review the results of STEP 1 before running this!

-- STEP 1: Check what we're about to do
SELECT 
  'Profiles to Assign' as action,
  COUNT(*) as count,
  STRING_AGG(email, ', ') as emails
FROM profiles
WHERE company_id IS NULL;

-- STEP 2: Show available companies
SELECT 
  'Available Companies' as info,
  id,
  name,
  slug
FROM companies
ORDER BY created_at;

-- STEP 3: Assign all NULL profiles to the first company
-- ⚠️ UNCOMMENT TO EXECUTE:
/*
UPDATE profiles
SET company_id = (
  SELECT id FROM companies ORDER BY created_at LIMIT 1
)
WHERE company_id IS NULL
RETURNING id, email, company_id;
*/

-- STEP 4: Verify
SELECT 
  'Verification' as check_type,
  COUNT(*) FILTER (WHERE company_id IS NOT NULL) as assigned,
  COUNT(*) FILTER (WHERE company_id IS NULL) as unassigned
FROM profiles;


