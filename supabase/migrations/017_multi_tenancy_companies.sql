-- Multi-Tenancy: Companies Table
-- Master table for all tenant companies on the platform

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Company Information
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-safe identifier (lowercase, hyphens only)
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'US',
  
  -- Account Status
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'suspended', 'cancelled')),
  plan TEXT NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial', 'basic', 'pro', 'enterprise')),
  
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#06b6d4', -- Default VIZLA brand color
  
  -- Settings & Configuration
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Billing (for future use)
  stripe_customer_id TEXT,
  subscription_id TEXT,
  
  -- Trial Management
  trial_ends_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
  
  -- Constraints
  CONSTRAINT companies_slug_format CHECK (slug ~ '^[a-z0-9-]+$'), -- Only lowercase, numbers, hyphens
  CONSTRAINT companies_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_plan ON companies(plan);
CREATE INDEX IF NOT EXISTS idx_companies_deleted_at ON companies(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_companies_email ON companies(email);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
-- Note: These are initial permissive policies for setup
-- Migration 018 will add company_id to profiles table
-- Migration 020 will update these policies to be more restrictive

-- Initial policy: Allow authenticated users to view companies during setup
-- This will be tightened after migration 018 adds company_id
CREATE POLICY "Users can view companies during setup"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

-- Initial policy: Allow service role full access (for Edge Functions)
CREATE POLICY "Service role full access to companies"
  ON companies FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Note: More restrictive policies will be created in migration 020
-- after company_id is added to profiles table

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_companies_updated_at();

-- Helper function to generate slug from name
CREATE OR REPLACE FUNCTION generate_company_slug(company_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(regexp_replace(company_name, '[^a-z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  -- Ensure it's not empty
  IF base_slug = '' THEN
    base_slug := 'company';
  END IF;
  
  -- Check uniqueness, append number if needed
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM companies WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, UPDATE ON companies TO authenticated;
GRANT ALL ON companies TO service_role;

