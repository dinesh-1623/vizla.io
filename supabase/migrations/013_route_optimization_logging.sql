-- Route Optimization Logging (Optional)
-- Adds support for logging AI route optimization results
-- This migration is OPTIONAL - the AI Driver Progress feature works without it

-- Add metadata column to ai_processing_logs if it doesn't exist
-- This allows storing detailed route optimization results
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_processing_logs' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE ai_processing_logs
    ADD COLUMN metadata JSONB;
    
    -- Add index for JSONB queries
    CREATE INDEX idx_ai_processing_logs_metadata ON ai_processing_logs USING GIN (metadata);
  END IF;
END $$;

-- Optional: Create a dedicated table for route optimization results
-- This allows storing and querying optimization history
CREATE TABLE IF NOT EXISTS route_optimization_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Context
  driver_id UUID, -- Optional: track which driver this optimization was for
  shift_date DATE DEFAULT CURRENT_DATE,
  shift_length_hours DECIMAL(4,2),
  strategy TEXT, -- 'lot', 'stash', 'optimized'
  
  -- Optimization results
  batches_count INTEGER,
  vehicles_count INTEGER,
  efficiency_improvement DECIMAL(5,2), -- Percentage improvement
  predicted_total_time INTEGER, -- minutes
  current_total_time INTEGER, -- minutes
  estimated_savings INTEGER, -- minutes
  
  -- Risk assessment
  overall_risk TEXT, -- 'low', 'medium', 'high', 'critical'
  high_risk_routes TEXT[], -- Array of batch IDs with high risk
  
  -- AI metadata
  token_usage JSONB, -- { totalTokens, promptTokens, completionTokens, estimatedCostUsd }
  confidence_scores JSONB, -- { average: 0.85, min: 0.70, max: 0.95 }
  processing_time_ms INTEGER,
  model_version TEXT, -- e.g., 'gpt-4o-mini'
  
  -- Optimization details
  optimized_routes JSONB, -- Array of optimized route objects
  recommendations TEXT[], -- Array of AI recommendations
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  applied_at TIMESTAMPTZ, -- When optimization was applied
  applied_by UUID, -- User who applied the optimization
  
  -- Metadata
  notes TEXT
);

-- Create indexes for route_optimization_results
CREATE INDEX IF NOT EXISTS idx_route_optimization_results_driver_id ON route_optimization_results(driver_id);
CREATE INDEX IF NOT EXISTS idx_route_optimization_results_shift_date ON route_optimization_results(shift_date);
CREATE INDEX IF NOT EXISTS idx_route_optimization_results_strategy ON route_optimization_results(strategy);
CREATE INDEX IF NOT EXISTS idx_route_optimization_results_overall_risk ON route_optimization_results(overall_risk);
CREATE INDEX IF NOT EXISTS idx_route_optimization_results_created_at ON route_optimization_results(created_at);
CREATE INDEX IF NOT EXISTS idx_route_optimization_results_optimized_routes ON route_optimization_results USING GIN (optimized_routes);
CREATE INDEX IF NOT EXISTS idx_route_optimization_results_token_usage ON route_optimization_results USING GIN (token_usage);

-- Enable RLS
ALTER TABLE route_optimization_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for route_optimization_results
DROP POLICY IF EXISTS "Anyone can read optimization results" ON route_optimization_results;
CREATE POLICY "Anyone can read optimization results"
  ON route_optimization_results FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "System can insert optimization results" ON route_optimization_results;
CREATE POLICY "System can insert optimization results"
  ON route_optimization_results FOR INSERT
  WITH CHECK (true); -- Allow Edge Functions to log

DROP POLICY IF EXISTS "Admins and dispatchers can update optimization results" ON route_optimization_results;
CREATE POLICY "Admins and dispatchers can update optimization results"
  ON route_optimization_results FOR UPDATE
  USING (is_admin() OR get_user_role() = 'dispatcher');

DROP POLICY IF EXISTS "Admins can delete optimization results" ON route_optimization_results;
CREATE POLICY "Admins can delete optimization results"
  ON route_optimization_results FOR DELETE
  USING (is_admin());

-- Add comments for documentation
COMMENT ON TABLE route_optimization_results IS 'Stores AI route optimization results for historical analysis and performance tracking';
COMMENT ON COLUMN route_optimization_results.efficiency_improvement IS 'Percentage improvement in route efficiency (e.g., 12.5 for 12.5% improvement)';
COMMENT ON COLUMN route_optimization_results.estimated_savings IS 'Estimated time savings in minutes';
COMMENT ON COLUMN route_optimization_results.overall_risk IS 'Overall risk level: low, medium, high, or critical';
COMMENT ON COLUMN route_optimization_results.optimized_routes IS 'JSON array of optimized routes with predictions and risk assessments';
COMMENT ON COLUMN route_optimization_results.token_usage IS 'JSON object with token usage and cost information';

-- Grant execute permissions (if needed for functions)
GRANT EXECUTE ON FUNCTION uuid_generate_v4() TO authenticated;

