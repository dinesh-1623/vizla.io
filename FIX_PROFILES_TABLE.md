# 🔧 Fix Profiles Table - Add Missing Columns

## Problem
The `profiles` table is missing the `notes` and `phone` columns, causing errors when creating/editing users.

## Solution
Run this SQL migration in your Supabase SQL Editor.

## Quick Fix

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **SQL Editor**

2. **Run This Migration**

Copy and paste the entire contents of `supabase/migrations/015_add_profiles_notes_phone.sql`:

```sql
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
```

3. **Click "Run"** in the SQL Editor

4. **Refresh Your Browser**
   - Go back to the Users page
   - Refresh the page (Cmd+R or F5)
   - The error should be gone!

## What This Does

- ✅ Adds `notes` column (TEXT, nullable)
- ✅ Adds `phone` column (TEXT, nullable)  
- ✅ Adds `status` column (TEXT with validation)
- ✅ Creates indexes for performance
- ✅ Adds RLS policy for service role access

## Verification

After running the migration, you can verify it worked:

```sql
-- Check if columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('notes', 'phone', 'status')
ORDER BY column_name;
```

You should see all three columns listed.

## Notes

- This migration is **idempotent** - safe to run multiple times
- It only adds columns that don't exist
- Won't break existing data
- All new columns are nullable, so existing rows won't be affected

---

**After running this migration, refresh your Users page and try creating a user again!** 🎉


