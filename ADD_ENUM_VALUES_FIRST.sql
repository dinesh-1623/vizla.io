-- STEP 1: Add Enum Values FIRST (Run this separately before migration 018)
-- These must be committed in separate transactions

-- Add super_admin to user_role enum
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') 
     AND NOT EXISTS (
       SELECT 1 FROM pg_enum 
       WHERE enumlabel = 'super_admin' 
       AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
     ) THEN
    ALTER TYPE user_role ADD VALUE 'super_admin';
    RAISE NOTICE 'Added super_admin to user_role enum';
  ELSE
    RAISE NOTICE 'super_admin already exists or user_role enum not found';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'super_admin already exists in user_role enum';
END $$;

-- Add company_admin to user_role enum
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') 
     AND NOT EXISTS (
       SELECT 1 FROM pg_enum 
       WHERE enumlabel = 'company_admin' 
       AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
     ) THEN
    ALTER TYPE user_role ADD VALUE 'company_admin';
    RAISE NOTICE 'Added company_admin to user_role enum';
  ELSE
    RAISE NOTICE 'company_admin already exists or user_role enum not found';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'company_admin already exists in user_role enum';
END $$;


