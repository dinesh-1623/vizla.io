-- Multi-Tenancy: Update Profiles Table (Users Table)
-- Add company_id, roles, permissions, and invitation fields
-- Note: The table is called 'profiles' in this codebase, not 'users'

-- IMPORTANT: You MUST run ADD_ENUM_VALUES_FIRST.sql BEFORE this migration!
-- The enum values (super_admin, company_admin) must be committed separately.

-- Check if enum values exist - if not, give clear error
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'super_admin' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
      RAISE EXCEPTION 'Missing enum value: super_admin. You MUST run ADD_ENUM_VALUES_FIRST.sql first!';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'company_admin' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
      RAISE EXCEPTION 'Missing enum value: company_admin. You MUST run ADD_ENUM_VALUES_FIRST.sql first!';
    END IF;
  END IF;
END $$;

-- Add company_id column (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Add or update role column
-- Handle both enum and text types
-- NOTE: If role is an enum type, the enum itself enforces values (no CHECK needed)
-- If role is TEXT, we'll add a CHECK constraint (but only after enum values exist)
DO $$ 
DECLARE
  is_enum_type BOOLEAN;
  role_column_exists BOOLEAN;
BEGIN
  -- Check if role column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) INTO role_column_exists;
  
  IF role_column_exists THEN
    -- Column exists - check if it's an enum type
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns c
      JOIN pg_type t ON c.udt_name = t.typname
      WHERE c.table_schema = 'public' 
      AND c.table_name = 'profiles' 
      AND c.column_name = 'role'
      AND t.typtype = 'e'  -- enum type
    ) INTO is_enum_type;
    
    -- If it's an enum type, no CHECK constraint needed (enum enforces values)
    -- If it's TEXT, we'll skip adding CHECK constraint here (would fail if enum values don't exist)
    -- The enum values should already be added by ADD_ENUM_VALUES_FIRST.sql
    IF NOT is_enum_type THEN
      -- It's TEXT - we could add a CHECK constraint, but only if enum values exist
      -- For now, skip CHECK constraint to avoid validation errors
      -- You can add it manually later if needed
      RAISE NOTICE 'Role column is TEXT type. CHECK constraint skipped to avoid enum validation errors.';
    ELSE
      RAISE NOTICE 'Role column is enum type. Enum values should be added via ADD_ENUM_VALUES_FIRST.sql';
    END IF;
  ELSE
    -- Column doesn't exist - check if user_role enum exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
      -- Use enum type (assumes enum values were added via ADD_ENUM_VALUES_FIRST.sql)
      ALTER TABLE profiles ADD COLUMN role user_role NOT NULL DEFAULT 'driver';
    ELSE
      -- No enum type - create as TEXT (no CHECK constraint to avoid validation)
      ALTER TABLE profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'driver';
    END IF;
  END IF;
END $$;

-- Add status column (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' 
      CHECK (status IN ('pending', 'active', 'inactive', 'suspended'));
  END IF;
END $$;

-- Add permissions JSONB column (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'permissions'
  ) THEN
    ALTER TABLE profiles ADD COLUMN permissions JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add invitation fields
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'invited_by'
  ) THEN
    ALTER TABLE profiles ADD COLUMN invited_by UUID REFERENCES profiles(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'invitation_token'
  ) THEN
    ALTER TABLE profiles ADD COLUMN invitation_token TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'invitation_expires_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN invitation_expires_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_login_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_invitation_token ON profiles(invitation_token) WHERE invitation_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at) WHERE deleted_at IS NULL;

-- Function to set default permissions based on role
-- Note: This function takes TEXT parameter, not enum, so it's safe even if enum values don't exist yet
CREATE OR REPLACE FUNCTION get_default_permissions(user_role TEXT)
RETURNS JSONB AS $$
BEGIN
  -- Handle both old and new role values
  CASE user_role
    WHEN 'super_admin' THEN
      RETURN '{
        "vehicles": {"view": true, "create": true, "edit": true, "delete": true, "assign": true},
        "users": {"view": true, "create": true, "edit": true, "delete": true, "invite": true},
        "ai_features": {"smart_dispatch": true, "route_optimization": true, "capacity_prediction": true, "note_parsing": true, "route_clustering": true},
        "reports": {"view": true, "generate": true, "export": true},
        "settings": {"company": true, "zones": true, "markets": true, "billing": true},
        "admin": {"manage_users": true, "manage_roles": true, "view_audit_logs": true}
      }'::jsonb;
    
    WHEN 'company_admin' THEN
      RETURN '{
        "vehicles": {"view": true, "create": true, "edit": true, "delete": true, "assign": true},
        "users": {"view": true, "create": true, "edit": true, "delete": true, "invite": true},
        "ai_features": {"smart_dispatch": true, "route_optimization": true, "capacity_prediction": true, "note_parsing": true, "route_clustering": true},
        "reports": {"view": true, "generate": true, "export": true},
        "settings": {"company": true, "zones": true, "markets": true, "billing": false},
        "admin": {"manage_users": true, "manage_roles": true, "view_audit_logs": true}
      }'::jsonb;
    
    WHEN 'manager' THEN
      RETURN '{
        "vehicles": {"view": true, "create": true, "edit": true, "delete": false, "assign": true},
        "users": {"view": true, "create": false, "edit": false, "delete": false, "invite": false},
        "ai_features": {"smart_dispatch": true, "route_optimization": true, "capacity_prediction": true, "note_parsing": true, "route_clustering": true},
        "reports": {"view": true, "generate": true, "export": true},
        "settings": {"company": false, "zones": false, "markets": false, "billing": false},
        "admin": {"manage_users": false, "manage_roles": false, "view_audit_logs": true}
      }'::jsonb;
    
    WHEN 'dispatcher' THEN
      RETURN '{
        "vehicles": {"view": true, "create": true, "edit": true, "delete": false, "assign": true},
        "users": {"view": true, "create": false, "edit": false, "delete": false, "invite": false},
        "ai_features": {"smart_dispatch": true, "route_optimization": true, "capacity_prediction": false, "note_parsing": true, "route_clustering": true},
        "reports": {"view": true, "generate": false, "export": false},
        "settings": {"company": false, "zones": false, "markets": false, "billing": false},
        "admin": {"manage_users": false, "manage_roles": false, "view_audit_logs": false}
      }'::jsonb;
    
    WHEN 'driver' THEN
      RETURN '{
        "vehicles": {"view": true, "create": false, "edit": false, "delete": false, "assign": false},
        "users": {"view": false, "create": false, "edit": false, "delete": false, "invite": false},
        "ai_features": {"smart_dispatch": false, "route_optimization": true, "capacity_prediction": false, "note_parsing": false, "route_clustering": false},
        "reports": {"view": false, "generate": false, "export": false},
        "settings": {"company": false, "zones": false, "markets": false, "billing": false},
        "admin": {"manage_users": false, "manage_roles": false, "view_audit_logs": false}
      }'::jsonb;
    
    WHEN 'spotter' THEN
      RETURN '{
        "vehicles": {"view": false, "create": false, "edit": false, "delete": false, "assign": false},
        "users": {"view": false, "create": false, "edit": false, "delete": false, "invite": false},
        "ai_features": {"smart_dispatch": false, "route_optimization": false, "capacity_prediction": false, "note_parsing": false, "route_clustering": false},
        "reports": {"view": false, "generate": false, "export": false},
        "settings": {"company": false, "zones": false, "markets": false, "billing": false},
        "admin": {"manage_users": false, "manage_roles": false, "view_audit_logs": false}
      }'::jsonb;
    
    ELSE
      RETURN '{}'::jsonb;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set default permissions when role changes
CREATE OR REPLACE FUNCTION set_user_permissions()
RETURNS TRIGGER AS $$
BEGIN
  -- If permissions are empty or role changed, set default permissions
  IF NEW.permissions IS NULL OR NEW.permissions = '{}'::jsonb OR OLD.role != NEW.role THEN
    NEW.permissions := get_default_permissions(NEW.role);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_set_user_permissions ON profiles;
CREATE TRIGGER trigger_set_user_permissions
  BEFORE INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_user_permissions();

-- Update existing RLS policies to include company isolation
-- Drop old policies
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_authenticated" ON profiles;
DROP POLICY IF EXISTS "profiles_service_role_all" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_authenticated" ON profiles;

-- Drop new policies if they exist (from previous partial run)
DROP POLICY IF EXISTS "Users can view own company users" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Company admins can manage company users" ON profiles;
DROP POLICY IF EXISTS "Service role full access" ON profiles;

-- Create new company-aware policies
CREATE POLICY "Users can view own company users"
  ON profiles FOR SELECT
  USING (
    -- Users can see themselves
    id = auth.uid()
    OR
    -- Users can see others in their company
    (
      company_id = (
        SELECT company_id 
        FROM profiles 
        WHERE id = auth.uid()
      )
      AND deleted_at IS NULL
    )
    OR
    -- Super admins can see all
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Company admins can manage company users"
  ON profiles FOR ALL
  USING (
    company_id = (
      SELECT company_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('company_admin', 'super_admin')
    )
  )
  WITH CHECK (
    company_id = (
      SELECT company_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('company_admin', 'super_admin')
    )
  );

CREATE POLICY "Service role full access"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT, UPDATE ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;

