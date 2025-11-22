-- Fix profiles table RLS policies and ensure columns exist
-- This migration fixes infinite recursion and missing columns

-- Step 1: Drop existing problematic policies to avoid conflicts
DO $$ 
BEGIN
  -- Drop policies that might cause recursion
  DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
  DROP POLICY IF EXISTS "Service role full access" ON profiles;
END $$;

-- Step 2: Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'notes'
  ) THEN
    ALTER TABLE profiles ADD COLUMN notes TEXT;
    RAISE NOTICE 'Added notes column to profiles';
  END IF;

  -- Add phone column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone TEXT;
    RAISE NOTICE 'Added phone column to profiles';
  END IF;

  -- Add status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'));
    RAISE NOTICE 'Added status column to profiles';
  END IF;
END $$;

-- Step 3: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Step 4: Create RLS policies WITHOUT recursion
-- Policy 1: Users can view their own profile (simple, no recursion)
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Users can update their own profile (simple, no recursion)
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: Authenticated users can view all profiles (for admin UI)
-- This is needed for the user management page
CREATE POLICY "profiles_select_authenticated"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Policy 4: Service role has full access (for backend operations)
CREATE POLICY "profiles_service_role_all"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 5: Allow inserts for authenticated users (for user creation)
CREATE POLICY "profiles_insert_authenticated"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Step 5: Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;


