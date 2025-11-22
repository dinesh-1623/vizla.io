-- Multi-Tenancy: Audit Logs Table
-- Comprehensive audit trail for security and compliance

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Who
  user_id UUID REFERENCES profiles(id),
  company_id UUID REFERENCES companies(id),
  
  -- What
  action TEXT NOT NULL, -- 'user.created', 'vehicle.deleted', 'company.settings.updated', etc.
  resource_type TEXT, -- 'user', 'vehicle', 'company', 'alert', etc.
  resource_id UUID,
  
  -- Changes
  changes JSONB, -- Before/after values, or change details
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional context
  
  -- Where/How
  ip_address TEXT,
  user_agent TEXT,
  method TEXT, -- HTTP method if applicable
  endpoint TEXT, -- API endpoint if applicable
  
  -- When
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Composite index for company activity queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_created ON audit_logs(company_id, created_at DESC);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view audit logs for their company
CREATE POLICY "Users can view own company audit logs"
  ON audit_logs FOR SELECT
  USING (
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
  );

-- Only system can insert audit logs (via service role or triggers)
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Function to log audit events (called from application/triggers)
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_company_id UUID,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    company_id,
    action,
    resource_type,
    resource_id,
    changes,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_company_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_changes,
    p_metadata,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION log_audit_event TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit_event TO service_role;

-- Grant permissions
GRANT SELECT ON audit_logs TO authenticated;
GRANT INSERT ON audit_logs TO service_role;
GRANT ALL ON audit_logs TO service_role;

