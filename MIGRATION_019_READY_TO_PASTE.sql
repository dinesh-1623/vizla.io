-- Multi-Tenancy: Add company_id to All Tenant-Scoped Tables
-- This migration adds company_id to all tables that store company-specific data

-- Helper function to safely add company_id column
-- Only adds to tables that actually exist
CREATE OR REPLACE FUNCTION add_company_id_column(p_table_name TEXT, default_company_id UUID DEFAULT NULL)
RETURNS void AS $$
BEGIN
  -- Check if table exists first
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = p_table_name
  ) THEN
    RAISE NOTICE 'Table % does not exist, skipping', p_table_name;
    RETURN;
  END IF;
  
  -- Add column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = p_table_name 
    AND column_name = 'company_id'
  ) THEN
    EXECUTE format('ALTER TABLE %I ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE RESTRICT', p_table_name);
    RAISE NOTICE 'Added company_id column to %', p_table_name;
    
    -- Backfill with default company if provided
    IF default_company_id IS NOT NULL THEN
      EXECUTE format('UPDATE %I SET company_id = $1 WHERE company_id IS NULL', p_table_name) USING default_company_id;
      RAISE NOTICE 'Backfilled company_id for %', p_table_name;
    END IF;
    
    -- Make NOT NULL after backfill (only if default was provided)
    IF default_company_id IS NOT NULL THEN
      EXECUTE format('ALTER TABLE %I ALTER COLUMN company_id SET NOT NULL', p_table_name);
    END IF;
    
    -- Create index
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_company_id ON %I(company_id)', p_table_name, p_table_name);
    RAISE NOTICE 'Created index for company_id on %', p_table_name;
  ELSE
    RAISE NOTICE 'Table % already has company_id column, skipping', p_table_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add company_id to all tenant-scoped tables
-- Note: For existing data, you'll need to backfill with a default company
-- This migration adds the column but leaves it nullable for existing data

SELECT add_company_id_column('vehicles');
SELECT add_company_id_column('zones');
SELECT add_company_id_column('markets');
SELECT add_company_id_column('tow_trucks');
SELECT add_company_id_column('drivers');
SELECT add_company_id_column('spotters');
SELECT add_company_id_column('alerts');
SELECT add_company_id_column('vehicle_assignments');
SELECT add_company_id_column('vehicle_extracted_metadata');
SELECT add_company_id_column('alert_ai_priorities');
SELECT add_company_id_column('chat_conversations');
SELECT add_company_id_column('chat_messages');
SELECT add_company_id_column('spotter_submissions');
SELECT add_company_id_column('reports');
SELECT add_company_id_column('action_items');
SELECT add_company_id_column('storage_lots');

-- Note: For profiles table, we already added company_id in migration 018
-- But if it doesn't exist, add it here too
SELECT add_company_id_column('profiles');

-- Clean up helper function
DROP FUNCTION IF EXISTS add_company_id_column(TEXT, UUID);

