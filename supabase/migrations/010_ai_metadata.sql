-- AI Metadata Tables
-- Stores extracted metadata from AI processing and logs all AI operations

-- Vehicle extracted metadata table
-- Stores structured data extracted from unstructured notes using AI
CREATE TABLE vehicle_extracted_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES located_vehicles(id) ON DELETE CASCADE,
  
  -- Extracted fields
  parking_type TEXT,              -- e.g., "Parking Lot Secured", "Apartment Unsecured"
  gate_code TEXT,                 -- Gate code if mentioned
  damage_description TEXT,        -- Description of damage if noted
  special_instructions TEXT,      -- Special handling instructions
  estimated_fees DECIMAL(10,2),  -- Estimated fees if mentioned
  accessibility_score INTEGER,    -- 1-10 score for how easy access is
  
  -- Metadata
  confidence_score DECIMAL(3,2),  -- 0.00-1.00 confidence in extraction
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  extracted_by TEXT DEFAULT 'ai', -- 'ai' or user_id if manually edited
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Versioning
  raw_notes_snapshot TEXT,        -- Store notes at time of extraction
  model_version TEXT,             -- OpenAI model used (e.g., "gpt-4o-2024-08-06")
  
  UNIQUE(vehicle_id)
);

-- AI processing logs table
-- Tracks all AI processing operations for monitoring and cost tracking
CREATE TABLE ai_processing_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES located_vehicles(id) ON DELETE SET NULL,
  processing_type TEXT NOT NULL,  -- 'note_extraction', 'vehicle_classification', etc.
  status TEXT NOT NULL,           -- 'success', 'error', 'timeout'
  tokens_used INTEGER,
  cost_usd DECIMAL(10,6),
  processing_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for vehicle_extracted_metadata
CREATE INDEX idx_vehicle_extracted_metadata_vehicle_id ON vehicle_extracted_metadata(vehicle_id);
CREATE INDEX idx_vehicle_extracted_metadata_parking_type ON vehicle_extracted_metadata(parking_type);
CREATE INDEX idx_vehicle_extracted_metadata_accessibility ON vehicle_extracted_metadata(accessibility_score);

-- Create indexes for ai_processing_logs
CREATE INDEX idx_ai_processing_logs_created_at ON ai_processing_logs(created_at);
CREATE INDEX idx_ai_processing_logs_vehicle_id ON ai_processing_logs(vehicle_id);
CREATE INDEX idx_ai_processing_logs_processing_type ON ai_processing_logs(processing_type);
CREATE INDEX idx_ai_processing_logs_status ON ai_processing_logs(status);

-- Add optional columns to located_vehicles table for extraction tracking
ALTER TABLE located_vehicles 
ADD COLUMN IF NOT EXISTS metadata_extracted_at TIMESTAMPTZ;

ALTER TABLE located_vehicles 
ADD COLUMN IF NOT EXISTS metadata_extraction_status TEXT DEFAULT 'pending';

-- Add CHECK constraint for extraction status (separate statement required)
-- Note: We can't use IF NOT EXISTS with ADD CONSTRAINT, so we check first with DO block
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_metadata_extraction_status'
  ) THEN
    ALTER TABLE located_vehicles
    ADD CONSTRAINT check_metadata_extraction_status 
    CHECK (metadata_extraction_status IN ('pending', 'completed', 'failed', 'skipped'));
  END IF;
END $$;

-- Create index for extraction status filtering
CREATE INDEX IF NOT EXISTS idx_located_vehicles_extraction_status 
ON located_vehicles(metadata_extraction_status);

-- Enable RLS
ALTER TABLE vehicle_extracted_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_processing_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vehicle_extracted_metadata
CREATE POLICY "Anyone can read extracted metadata"
  ON vehicle_extracted_metadata FOR SELECT
  USING (true);

CREATE POLICY "Admins and dispatchers can insert extracted metadata"
  ON vehicle_extracted_metadata FOR INSERT
  WITH CHECK (is_admin() OR get_user_role() = 'dispatcher');

CREATE POLICY "Admins and dispatchers can update extracted metadata"
  ON vehicle_extracted_metadata FOR UPDATE
  USING (is_admin() OR get_user_role() = 'dispatcher');

CREATE POLICY "Admins can delete extracted metadata"
  ON vehicle_extracted_metadata FOR DELETE
  USING (is_admin());

-- RLS Policies for ai_processing_logs
CREATE POLICY "Admins and dispatchers can read processing logs"
  ON ai_processing_logs FOR SELECT
  USING (is_admin() OR get_user_role() = 'dispatcher');

CREATE POLICY "System can insert processing logs"
  ON ai_processing_logs FOR INSERT
  WITH CHECK (true); -- Allow system/edge functions to log

CREATE POLICY "Admins can delete processing logs"
  ON ai_processing_logs FOR DELETE
  USING (is_admin());

-- Trigger to update last_updated_at on vehicle_extracted_metadata
CREATE TRIGGER update_vehicle_extracted_metadata_updated_at
  BEFORE UPDATE ON vehicle_extracted_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE vehicle_extracted_metadata IS 'Stores structured metadata extracted from vehicle notes using AI';
COMMENT ON COLUMN vehicle_extracted_metadata.parking_type IS 'Type of parking location (e.g., Parking Lot Secured, Apartment Unsecured)';
COMMENT ON COLUMN vehicle_extracted_metadata.accessibility_score IS '1-10 score indicating how easy vehicle access is (1=very difficult, 10=very easy)';
COMMENT ON COLUMN vehicle_extracted_metadata.confidence_score IS 'AI confidence in extraction accuracy (0.00-1.00)';

COMMENT ON TABLE ai_processing_logs IS 'Tracks all AI processing operations for monitoring, debugging, and cost analysis';
COMMENT ON COLUMN ai_processing_logs.processing_type IS 'Type of AI processing performed (e.g., note_extraction, vehicle_classification)';
COMMENT ON COLUMN ai_processing_logs.cost_usd IS 'Estimated cost in USD for this processing operation';

