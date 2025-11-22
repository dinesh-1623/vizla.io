-- Add missing columns to profiles table for User Management
-- This migration adds 'notes' and 'phone' columns if they don't exist

-- Add notes column (TEXT, nullable)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'notes'
  ) THEN
    ALTER TABLE profiles ADD COLUMN notes TEXT;
  END IF;
END $$;

-- Add phone column (TEXT, nullable) if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone TEXT;
  END IF;
END $$;

-- Add status column if it doesn't exist (for user status)
-- Note: role column already exists as user_role enum type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'));
  END IF;
END $$;

-- Add index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- Update RLS policies to allow users to read their own profile
-- (Assuming RLS is already enabled, we just ensure the policies are correct)
-- Users can read their own profile
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);
  END IF;
END $$;

-- Users can update their own profile
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);
  END IF;
END $$;

-- Service role can do everything (for admin operations)
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
  END IF;
END $$;

