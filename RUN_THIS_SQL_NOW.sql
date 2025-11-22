-- ============================================
-- FIX PROFILES TABLE - RUN THIS IN SUPABASE SQL EDITOR
-- ============================================
-- This adds the missing 'notes', 'phone', and 'status' columns
-- Copy the entire contents below and paste into Supabase SQL Editor
-- ============================================

-- Add notes column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'notes'
  ) THEN
    ALTER TABLE profiles ADD COLUMN notes TEXT;
    RAISE NOTICE 'Added notes column';
  ELSE
    RAISE NOTICE 'notes column already exists';
  END IF;
END $$;

-- Add phone column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone TEXT;
    RAISE NOTICE 'Added phone column';
  ELSE
    RAISE NOTICE 'phone column already exists';
  END IF;
END $$;

-- Add status column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'));
    RAISE NOTICE 'Added status column';
  ELSE
    RAISE NOTICE 'status column already exists';
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- Add service role policy for admin operations
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Service role full access'
  ) THEN
    CREATE POLICY "Service role full access"
    ON profiles FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
    RAISE NOTICE 'Added service role policy';
  ELSE
    RAISE NOTICE 'Service role policy already exists';
  END IF;
END $$;

-- Refresh PostgREST schema cache (if pg_net extension is available)
-- This ensures the API immediately recognizes the new columns
NOTIFY pgrst, 'reload schema';

-- Verify columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('notes', 'phone', 'status')
ORDER BY column_name;

-- ============================================
-- After running this:
-- 1. Wait 2-3 seconds for schema cache to refresh
-- 2. Refresh your browser page
-- 3. Try creating a user again
-- ============================================


