-- Multi-Tenancy: Invitations Table
-- Manages user invitations to join companies

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
  
  -- Company and User Info
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('company_admin', 'manager', 'dispatcher', 'driver', 'spotter')),
  permissions JSONB, -- Optional custom permissions
  
  -- Invitation Details
  invited_by UUID REFERENCES profiles(id),
  personal_message TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  
  -- Timestamps
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_company_id ON invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at);

-- Enable RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own company invitations"
  ON invitations FOR SELECT
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

CREATE POLICY "Company admins can manage invitations"
  ON invitations FOR ALL
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

-- Function to mark expired invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE invitations
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending'
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON invitations TO authenticated;
GRANT ALL ON invitations TO service_role;

