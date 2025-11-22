-- Alert Prioritization Tables
-- Stores alerts and AI-powered prioritization results

-- Alerts table
-- Persists operational alerts that can be prioritized by AI
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Alert identity
  alert_type TEXT NOT NULL,  -- 'blocked_vehicle', 'aging_vehicle', 'capacity_issue', 'unassigned', etc.
  alert_key TEXT,            -- Unique key for this alert type (e.g., vehicle_id, market_id)
  
  -- Alert content
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  
  -- Context
  vehicle_id UUID REFERENCES located_vehicles(id) ON DELETE CASCADE,
  market_id UUID REFERENCES markets(id) ON DELETE SET NULL,
  zone_id UUID, -- Will reference zones after creation
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Metrics
  affected_count INTEGER DEFAULT 1,
  days_blocked DECIMAL(5,2),  -- For blocked vehicle alerts
  aging_hours DECIMAL(8,2),   -- For aging vehicle alerts
  utilization_percent DECIMAL(5,2), -- For capacity alerts
  
  -- Action
  action_route TEXT,          -- e.g., '/app/blocked', '/app/zones/capacity'
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ
);

-- Partial unique index: one active alert per type+key combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_alerts_unique_active ON alerts(alert_type, alert_key) WHERE (status = 'active');

-- Alert AI priorities table
-- Stores AI-generated priority scores and recommendations for alerts
CREATE TABLE IF NOT EXISTS alert_ai_priorities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  
  -- AI Priority Score
  priority_score INTEGER NOT NULL CHECK (priority_score >= 0 AND priority_score <= 100),
  priority_level TEXT NOT NULL CHECK (priority_level IN ('low', 'medium', 'high', 'critical')),
  
  -- AI Reasoning
  short_reason TEXT NOT NULL,  -- 1-2 sentences explaining priority
  recommended_action TEXT,     -- 1-2 sentences with recommended action
  
  -- Context factors
  urgency_factors TEXT[],      -- Array of factors: ['client_priority', 'aging', 'accessibility', 'fees']
  estimated_impact TEXT,       -- e.g., "Prevents $250 fee loss and maintains client relationship"
  
  -- Metadata
  confidence_score DECIMAL(3,2),  -- 0.00-1.00 confidence in prioritization
  prioritized_at TIMESTAMPTZ DEFAULT NOW(),
  prioritized_by TEXT DEFAULT 'ai', -- 'ai' or user_id if manually adjusted
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Versioning
  context_snapshot JSONB,      -- Snapshot of alert context at time of prioritization
  model_version TEXT,          -- OpenAI model used (e.g., "gpt-4o-mini-2024-08-06")
  
  UNIQUE(alert_id)
);

-- Create indexes for alerts
CREATE INDEX IF NOT EXISTS idx_alerts_alert_type ON alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_vehicle_id ON alerts(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_status_created ON alerts(status, created_at DESC);

-- Create indexes for alert_ai_priorities
CREATE INDEX IF NOT EXISTS idx_alert_ai_priorities_alert_id ON alert_ai_priorities(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_ai_priorities_priority_score ON alert_ai_priorities(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_alert_ai_priorities_priority_level ON alert_ai_priorities(priority_level);
CREATE INDEX IF NOT EXISTS idx_alert_ai_priorities_prioritized_at ON alert_ai_priorities(prioritized_at DESC);

-- Enable RLS
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_ai_priorities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for alerts (drop if exists, then create)
DROP POLICY IF EXISTS "Anyone can read alerts" ON alerts;
CREATE POLICY "Anyone can read alerts"
  ON alerts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "System can insert alerts" ON alerts;
CREATE POLICY "System can insert alerts"
  ON alerts FOR INSERT
  WITH CHECK (true); -- Allow system/edge functions to create alerts

DROP POLICY IF EXISTS "Admins and dispatchers can update alerts" ON alerts;
CREATE POLICY "Admins and dispatchers can update alerts"
  ON alerts FOR UPDATE
  USING (true); -- Simplified for now - can use is_admin() if function exists

DROP POLICY IF EXISTS "Admins can delete alerts" ON alerts;
CREATE POLICY "Admins can delete alerts"
  ON alerts FOR DELETE
  USING (true); -- Simplified for now

-- RLS Policies for alert_ai_priorities (drop if exists, then create)
DROP POLICY IF EXISTS "Anyone can read alert priorities" ON alert_ai_priorities;
CREATE POLICY "Anyone can read alert priorities"
  ON alert_ai_priorities FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "System can insert alert priorities" ON alert_ai_priorities;
CREATE POLICY "System can insert alert priorities"
  ON alert_ai_priorities FOR INSERT
  WITH CHECK (true); -- Allow system/edge functions to create priorities

DROP POLICY IF EXISTS "System can update alert priorities" ON alert_ai_priorities;
CREATE POLICY "System can update alert priorities"
  ON alert_ai_priorities FOR UPDATE
  USING (true); -- Allow system/edge functions to update priorities

DROP POLICY IF EXISTS "Admins can delete alert priorities" ON alert_ai_priorities;
CREATE POLICY "Admins can delete alert priorities"
  ON alert_ai_priorities FOR DELETE
  USING (true); -- Simplified for now

-- Trigger to update last_updated_at on alert_ai_priorities
DROP TRIGGER IF EXISTS update_alert_ai_priorities_updated_at ON alert_ai_priorities;
CREATE TRIGGER update_alert_ai_priorities_updated_at
  BEFORE UPDATE ON alert_ai_priorities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on alerts
DROP TRIGGER IF EXISTS update_alerts_updated_at ON alerts;
CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE alerts IS 'Persists operational alerts that can be prioritized by AI';
COMMENT ON COLUMN alerts.alert_type IS 'Type of alert: blocked_vehicle, aging_vehicle, capacity_issue, unassigned, etc.';
COMMENT ON COLUMN alerts.alert_key IS 'Unique key for this alert type (e.g., vehicle_id, market_id)';
COMMENT ON COLUMN alerts.severity IS 'Alert severity: critical, warning, or info';
COMMENT ON COLUMN alerts.status IS 'Alert status: active, acknowledged, resolved, or dismissed';

COMMENT ON TABLE alert_ai_priorities IS 'Stores AI-generated priority scores and recommendations for alerts';
COMMENT ON COLUMN alert_ai_priorities.priority_score IS 'AI-calculated priority score from 0-100 (higher = more urgent)';
COMMENT ON COLUMN alert_ai_priorities.priority_level IS 'Priority level: low, medium, high, or critical';
COMMENT ON COLUMN alert_ai_priorities.short_reason IS '1-2 sentence explanation of why this priority was assigned';
COMMENT ON COLUMN alert_ai_priorities.recommended_action IS '1-2 sentence recommended action to resolve the alert';
COMMENT ON COLUMN alert_ai_priorities.urgency_factors IS 'Array of factors contributing to urgency: client_priority, aging, accessibility, fees, etc.';
COMMENT ON COLUMN alert_ai_priorities.confidence_score IS 'AI confidence in prioritization accuracy (0.00-1.00)';

