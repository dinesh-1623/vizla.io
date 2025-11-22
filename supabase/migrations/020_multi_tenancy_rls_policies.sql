-- Multi-Tenancy: Row-Level Security Policies
-- Enforce data isolation at the database level for all tenant-scoped tables

-- Helper function to create company isolation policy
-- Only applies to tables that actually exist
CREATE OR REPLACE FUNCTION create_company_isolation_policy(p_table_name TEXT)
RETURNS void AS $$
BEGIN
  -- Check if table exists first
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = p_table_name
  ) THEN
    RAISE NOTICE 'Table % does not exist, skipping RLS setup', p_table_name;
    RETURN;
  END IF;
  
  -- Check if company_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = p_table_name 
    AND column_name = 'company_id'
  ) THEN
    RAISE NOTICE 'Table % does not have company_id column, skipping RLS setup', p_table_name;
    RETURN;
  END IF;
  
  -- Enable RLS
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', p_table_name);
  
  -- Drop existing policy if it exists
  EXECUTE format('DROP POLICY IF EXISTS %I_company_isolation ON %I', p_table_name, p_table_name);
  
  -- Create company isolation policy
  EXECUTE format($policy$
    CREATE POLICY %I_company_isolation ON %I
    FOR ALL
    USING (
      -- Normal users: see only their company's data
      company_id = (
        SELECT company_id 
        FROM profiles 
        WHERE id = auth.uid()
      )
      OR
      -- Super admins: see all data
      EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
      )
      OR
      -- Allow NULL company_id for system records (temporary, should be backfilled)
      company_id IS NULL
    )
    WITH CHECK (
      -- On insert/update, ensure company_id matches user's company
      company_id = (
        SELECT company_id 
        FROM profiles 
        WHERE id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
      )
    )
  $policy$, p_table_name, p_table_name);
  
  RAISE NOTICE 'Applied RLS policy to table %', p_table_name;
END;
$$ LANGUAGE plpgsql;

-- First, update companies table policies (replace initial permissive ones)
-- Drop initial setup policies
DROP POLICY IF EXISTS "Users can view companies during setup" ON companies;
DROP POLICY IF EXISTS "Service role full access to companies" ON companies;

-- Create proper company isolation policies for companies table
CREATE POLICY "Users can view own company"
  ON companies FOR SELECT
  USING (
    id = (
      SELECT company_id 
      FROM profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
    OR
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage companies"
  ON companies FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

CREATE POLICY "Company admins can update own company"
  ON companies FOR UPDATE
  USING (
    id = (
      SELECT company_id 
      FROM profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
    AND EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE id = auth.uid() 
      AND (role = 'company_admin' OR role = 'super_admin')
    )
  );

-- Keep service role access
CREATE POLICY "Service role full access to companies"
  ON companies FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Apply RLS policies to all tenant-scoped tables
SELECT create_company_isolation_policy('vehicles');
SELECT create_company_isolation_policy('zones');
SELECT create_company_isolation_policy('markets');
SELECT create_company_isolation_policy('tow_trucks');
SELECT create_company_isolation_policy('drivers');
SELECT create_company_isolation_policy('spotters');
SELECT create_company_isolation_policy('alerts');
SELECT create_company_isolation_policy('vehicle_assignments');
SELECT create_company_isolation_policy('vehicle_extracted_metadata');
SELECT create_company_isolation_policy('alert_ai_priorities');
SELECT create_company_isolation_policy('chat_conversations');
SELECT create_company_isolation_policy('chat_messages');
SELECT create_company_isolation_policy('spotter_submissions');
SELECT create_company_isolation_policy('reports');
SELECT create_company_isolation_policy('action_items');
SELECT create_company_isolation_policy('storage_lots');

-- Special handling for profiles table (already has custom policies, but ensure company isolation)
-- We already updated it in migration 018, but ensure RLS is enabled
-- Only enable if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on profiles table';
  ELSE
    RAISE NOTICE 'profiles table does not exist, skipping';
  END IF;
END $$;

-- Clean up helper function
DROP FUNCTION IF EXISTS create_company_isolation_policy(TEXT);

