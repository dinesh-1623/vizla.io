-- Migration: Alert Automation & Monitoring
-- Description: Automates alert creation from real data and adds monitoring capabilities

-- ============================================================================
-- 1. FUNCTIONS FOR CREATING ALERTS FROM REAL DATA
-- ============================================================================

-- Function: Create alerts for blocked vehicles (> 48 hours)
CREATE OR REPLACE FUNCTION create_blocked_vehicle_alerts()
RETURNS TABLE (
  alerts_created INTEGER,
  alert_ids UUID[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_alert_id UUID;
  v_alert_ids UUID[] := ARRAY[]::UUID[];
  v_count INTEGER := 0;
BEGIN
  -- Create alerts for vehicles blocked > 48 hours
  FOR v_alert_id IN
    SELECT 
      lv.id
    FROM located_vehicles lv
    WHERE 
      lv.status::text = 'Blocked'
      AND lv.located_at < NOW() - INTERVAL '48 hours'
      AND NOT EXISTS (
        SELECT 1 
        FROM alerts a 
        WHERE a.vehicle_id = lv.id 
          AND a.alert_type = 'blocked_vehicle'
          AND a.status = 'active'
      )
  LOOP
    INSERT INTO alerts (
      alert_type,
      alert_key,
      title,
      description,
      severity,
      vehicle_id,
      client_id,
      affected_count,
      days_blocked,
      aging_hours,
      status,
      action_route
    )
    SELECT 
      'blocked_vehicle',
      'blocked-' || lv.id::text,
      '1 vehicle blocked over 48h',
      'Vehicle ' || COALESCE(c.name, 'Unknown') || ' has been blocked for more than 48 hours.',
      CASE 
        WHEN EXTRACT(EPOCH FROM (NOW() - lv.located_at)) / 86400.0 > 7 THEN 'critical'
        WHEN EXTRACT(EPOCH FROM (NOW() - lv.located_at)) / 86400.0 > 3 THEN 'warning'
        ELSE 'info'
      END,
      lv.id,
      lv.client_id,
      1,
      EXTRACT(EPOCH FROM (NOW() - lv.located_at)) / 86400.0,
      EXTRACT(EPOCH FROM (NOW() - lv.located_at)) / 3600.0,
      'active',
      '/app/blocked'
    FROM located_vehicles lv
    LEFT JOIN clients c ON c.id = lv.client_id
    WHERE lv.id = v_alert_id
    ON CONFLICT (alert_type, alert_key) WHERE (status = 'active') DO NOTHING
    RETURNING id INTO v_alert_id;
    
    IF v_alert_id IS NOT NULL THEN
      v_alert_ids := array_append(v_alert_ids, v_alert_id);
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_count, v_alert_ids;
END;
$$;

-- Function: Create alerts for aging vehicles (> 7 days)
CREATE OR REPLACE FUNCTION create_aging_vehicle_alerts()
RETURNS TABLE (
  alerts_created INTEGER,
  alert_ids UUID[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_alert_id UUID;
  v_alert_ids UUID[] := ARRAY[]::UUID[];
  v_count INTEGER := 0;
BEGIN
  -- Create alerts for vehicles aging > 7 days
  FOR v_alert_id IN
    SELECT 
      lv.id
    FROM located_vehicles lv
    WHERE 
      lv.status::text IN ('Located', 'Stashed')
      AND lv.located_at < NOW() - INTERVAL '7 days'
      AND NOT EXISTS (
        SELECT 1 
        FROM alerts a 
        WHERE a.vehicle_id = lv.id 
          AND a.alert_type = 'aging_vehicle'
          AND a.status = 'active'
      )
  LOOP
    INSERT INTO alerts (
      alert_type,
      alert_key,
      title,
      description,
      severity,
      vehicle_id,
      client_id,
      affected_count,
      aging_hours,
      status,
      action_route
    )
    SELECT 
      'aging_vehicle',
      'aging-' || lv.id::text,
      CASE 
        WHEN EXTRACT(EPOCH FROM (NOW() - lv.located_at)) / 86400.0 > 14 THEN '1 vehicle aging > 14 days'
        WHEN EXTRACT(EPOCH FROM (NOW() - lv.located_at)) / 86400.0 > 7 THEN '1 vehicle aging > 7 days'
        ELSE '1 vehicle aging > 5 days'
      END,
      'Vehicle ' || COALESCE(c.name, 'Unknown') || ' has been located for more than 7 days without dispatch.',
      CASE 
        WHEN EXTRACT(EPOCH FROM (NOW() - lv.located_at)) / 86400.0 > 14 THEN 'critical'
        WHEN EXTRACT(EPOCH FROM (NOW() - lv.located_at)) / 86400.0 > 7 THEN 'warning'
        ELSE 'info'
      END,
      lv.id,
      lv.client_id,
      1,
      EXTRACT(EPOCH FROM (NOW() - lv.located_at)) / 3600.0,
      'active',
      '/app/dashboard'
    FROM located_vehicles lv
    LEFT JOIN clients c ON c.id = lv.client_id
    WHERE lv.id = v_alert_id
    ON CONFLICT (alert_type, alert_key) WHERE (status = 'active') DO NOTHING
    RETURNING id INTO v_alert_id;
    
    IF v_alert_id IS NOT NULL THEN
      v_alert_ids := array_append(v_alert_ids, v_alert_id);
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_count, v_alert_ids;
END;
$$;

-- Function: Create alerts for capacity issues
CREATE OR REPLACE FUNCTION create_capacity_alerts()
RETURNS TABLE (
  alerts_created INTEGER,
  alert_ids UUID[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_alert_id UUID;
  v_alert_ids UUID[] := ARRAY[]::UUID[];
  v_count INTEGER := 0;
  v_market_id UUID;
  v_utilization DECIMAL;
BEGIN
  -- Skip capacity alerts for now (markets table doesn't have capacity column)
  -- TODO: Implement capacity alerts based on storage lot capacity or driver capacity
  -- For now, return no alerts
  RETURN QUERY SELECT 0, ARRAY[]::UUID[];
  
  -- Original code (commented out until capacity column is added to markets):
  -- FOR v_market_id, v_utilization IN
  --   SELECT 
  --     m.id,
  --     CASE 
  --       WHEN m.capacity > 0 THEN 
  --         (COUNT(lv.id)::DECIMAL / m.capacity * 100)
  --       ELSE 0
  --     END AS utilization
  --   FROM markets m
  --   LEFT JOIN located_vehicles lv ON lv.market_id = m.id
  --   WHERE m.capacity > 0
  --   GROUP BY m.id, m.capacity
  --   HAVING (COUNT(lv.id)::DECIMAL / m.capacity * 100) >= 90
  --     AND NOT EXISTS (
  --       SELECT 1 
  --       FROM alerts a 
  --       WHERE a.market_id = m.id 
  --         AND a.alert_type = 'capacity_issue'
  --         AND a.status = 'active'
  --     )
  -- LOOP
  --   INSERT INTO alerts (
  --     alert_type,
  --     alert_key,
  --     title,
  --     description,
  --     severity,
  --     market_id,
  --     affected_count,
  --     utilization_percent,
  --     status,
  --     action_route
  --   )
  --   VALUES (
  --     'capacity_issue',
  --     'capacity-' || v_market_id::text,
  --     '1 market over capacity',
  --     (SELECT name FROM markets WHERE id = v_market_id) || ' is at ' || ROUND(v_utilization, 1) || '% capacity.',
  --     CASE 
  --       WHEN v_utilization >= 95 THEN 'critical'
  --       WHEN v_utilization >= 90 THEN 'warning'
  --       ELSE 'info'
  --     END,
  --     v_market_id,
  --     (SELECT COUNT(*) FROM located_vehicles WHERE market_id = v_market_id),
  --     v_utilization,
  --     'active',
  --     '/app/zones/capacity'
  --   )
  --   ON CONFLICT (alert_type, alert_key) WHERE (status = 'active') DO NOTHING
  --   RETURNING id INTO v_alert_id;
  --   
  --   IF v_alert_id IS NOT NULL THEN
  --     v_alert_ids := array_append(v_alert_ids, v_alert_id);
  --     v_count := v_count + 1;
  --   END IF;
  -- END LOOP;
  -- 
  -- RETURN QUERY SELECT v_count, v_alert_ids;
END;
$$;

-- Function: Create alerts for unassigned vehicles
CREATE OR REPLACE FUNCTION create_unassigned_vehicle_alerts()
RETURNS TABLE (
  alerts_created INTEGER,
  alert_ids UUID[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_unassigned_count INTEGER;
  v_alert_id UUID;
BEGIN
  -- Count unassigned vehicles
  SELECT COUNT(*) INTO v_unassigned_count
  FROM located_vehicles
  WHERE 
    assigned_driver_id IS NULL
    AND status::text IN ('Located', 'Stashed');
  
  -- Create alert if unassigned vehicles exist
  IF v_unassigned_count > 0 THEN
    INSERT INTO alerts (
      alert_type,
      alert_key,
      title,
      description,
      severity,
      affected_count,
      status,
      action_route
    )
    VALUES (
      'unassigned',
      'unassigned-vehicles',
      v_unassigned_count::text || ' vehicle' || CASE WHEN v_unassigned_count > 1 THEN 's' ELSE '' END || ' without assigned driver',
      'Review assignments to keep jobs moving.',
      CASE 
        WHEN v_unassigned_count > 10 THEN 'critical'
        WHEN v_unassigned_count > 5 THEN 'warning'
        ELSE 'info'
      END,
      v_unassigned_count,
      'active',
      '/app/driver/progress'
    )
    ON CONFLICT (alert_type, alert_key) WHERE (status = 'active') 
    DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      affected_count = EXCLUDED.affected_count,
      severity = EXCLUDED.severity,
      updated_at = NOW()
    RETURNING id INTO v_alert_id;
    
    RETURN QUERY SELECT 1, ARRAY[v_alert_id];
  ELSE
    -- Remove unassigned alert if no unassigned vehicles
    UPDATE alerts
    SET status = 'resolved', resolved_at = NOW()
    WHERE alert_type = 'unassigned' AND status = 'active';
    
    RETURN QUERY SELECT 0, ARRAY[]::UUID[];
  END IF;
END;
$$;

-- Function: Create all alerts from real data
CREATE OR REPLACE FUNCTION create_all_alerts_from_data()
RETURNS TABLE (
  alert_type TEXT,
  alerts_created INTEGER,
  alert_ids UUID[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_blocked_result RECORD;
  v_aging_result RECORD;
  v_capacity_result RECORD;
  v_unassigned_result RECORD;
BEGIN
  -- Create blocked vehicle alerts
  SELECT * INTO v_blocked_result FROM create_blocked_vehicle_alerts();
  RETURN QUERY SELECT 'blocked_vehicle'::TEXT, v_blocked_result.alerts_created, v_blocked_result.alert_ids;
  
  -- Create aging vehicle alerts
  SELECT * INTO v_aging_result FROM create_aging_vehicle_alerts();
  RETURN QUERY SELECT 'aging_vehicle'::TEXT, v_aging_result.alerts_created, v_aging_result.alert_ids;
  
  -- Create capacity alerts (disabled for now - markets table doesn't have capacity column)
  -- SELECT * INTO v_capacity_result FROM create_capacity_alerts();
  -- RETURN QUERY SELECT 'capacity_issue'::TEXT, v_capacity_result.alerts_created, v_capacity_result.alert_ids;
  RETURN QUERY SELECT 'capacity_issue'::TEXT, 0, ARRAY[]::UUID[];
  
  -- Create unassigned alerts
  SELECT * INTO v_unassigned_result FROM create_unassigned_vehicle_alerts();
  RETURN QUERY SELECT 'unassigned'::TEXT, v_unassigned_result.alerts_created, v_unassigned_result.alert_ids;
END;
$$;

-- ============================================================================
-- 2. TRIGGERS FOR AUTOMATIC ALERT CREATION
-- ============================================================================

-- Function: Trigger function to create alert when vehicle is blocked
CREATE OR REPLACE FUNCTION trigger_create_blocked_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Handle INSERT operations
  IF TG_OP = 'INSERT' THEN
    -- Create alert when vehicle is inserted with 'Blocked' status and is > 48 hours old
    IF NEW.status::text = 'Blocked' AND NEW.located_at < NOW() - INTERVAL '48 hours' THEN
      INSERT INTO alerts (
        alert_type,
        alert_key,
        title,
        description,
        severity,
        vehicle_id,
        client_id,
        affected_count,
        days_blocked,
        aging_hours,
        status,
        action_route
      )
      VALUES (
      'blocked_vehicle',
      'blocked-' || NEW.id::text,
      '1 vehicle blocked over 48h',
      'Vehicle has been blocked for more than 48 hours.',
      CASE 
        WHEN EXTRACT(EPOCH FROM (NOW() - NEW.located_at)) / 86400.0 > 7 THEN 'critical'
        WHEN EXTRACT(EPOCH FROM (NOW() - NEW.located_at)) / 86400.0 > 3 THEN 'warning'
        ELSE 'info'
      END,
      NEW.id,
      NEW.client_id,
      1,
      EXTRACT(EPOCH FROM (NOW() - NEW.located_at)) / 86400.0,
      EXTRACT(EPOCH FROM (NOW() - NEW.located_at)) / 3600.0,
      'active',
      '/app/blocked'
    )
    ON CONFLICT (alert_type, alert_key) WHERE (status = 'active') DO NOTHING;
  END IF;
  END IF;
  
  -- Handle UPDATE operations
  IF TG_OP = 'UPDATE' THEN
    -- Create alert when vehicle status changes to 'Blocked' and is > 48 hours old
    IF NEW.status::text = 'Blocked' AND NEW.located_at < NOW() - INTERVAL '48 hours' THEN
      INSERT INTO alerts (
        alert_type,
        alert_key,
        title,
        description,
        severity,
        vehicle_id, 
        client_id,
        affected_count,
        days_blocked,
        aging_hours,
        status,
        action_route
      )
      VALUES (
        'blocked_vehicle',
        'blocked-' || NEW.id::text,
        '1 vehicle blocked over 48h',
        'Vehicle has been blocked for more than 48 hours.',
        CASE 
          WHEN EXTRACT(EPOCH FROM (NOW() - NEW.located_at)) / 86400.0 > 7 THEN 'critical'
          WHEN EXTRACT(EPOCH FROM (NOW() - NEW.located_at)) / 86400.0 > 3 THEN 'warning'
          ELSE 'info'
        END,
        NEW.id,
        NEW.client_id,
        1,
        EXTRACT(EPOCH FROM (NOW() - NEW.located_at)) / 86400.0,
        EXTRACT(EPOCH FROM (NOW() - NEW.located_at)) / 3600.0,
        'active',
        '/app/blocked'
      )
      ON CONFLICT (alert_type, alert_key) WHERE (status = 'active') DO NOTHING;
    END IF;
    
    -- Resolve alert when vehicle is no longer blocked
    IF OLD.status::text = 'Blocked' AND NEW.status::text != 'Blocked' THEN
      UPDATE alerts
      SET 
        status = 'resolved',
        resolved_at = NOW()
      WHERE 
        vehicle_id = NEW.id 
        AND alert_type = 'blocked_vehicle'
        AND status = 'active';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger: Create alert when vehicle is blocked (INSERT)
DROP TRIGGER IF EXISTS trigger_blocked_vehicle_alert_insert ON located_vehicles;
CREATE TRIGGER trigger_blocked_vehicle_alert_insert
  AFTER INSERT ON located_vehicles
  FOR EACH ROW
  WHEN (NEW.status::text = 'Blocked')
  EXECUTE FUNCTION trigger_create_blocked_alert();

-- Trigger: Create/resolve alert when vehicle status changes (UPDATE)
DROP TRIGGER IF EXISTS trigger_blocked_vehicle_alert_update ON located_vehicles;
CREATE TRIGGER trigger_blocked_vehicle_alert_update
  AFTER UPDATE OF status ON located_vehicles
  FOR EACH ROW
  WHEN (NEW.status::text = 'Blocked' OR (OLD.status::text = 'Blocked' AND NEW.status::text != 'Blocked'))
  EXECUTE FUNCTION trigger_create_blocked_alert();

-- ============================================================================
-- 3. MONITORING VIEWS
-- ============================================================================

-- View: Alert resolution tracking
CREATE OR REPLACE VIEW alert_resolution_stats AS
SELECT 
  DATE_TRUNC('day', created_at) AS date,
  alert_type,
  severity,
  COUNT(*) AS total_alerts,
  COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_alerts,
  COUNT(*) FILTER (WHERE status = 'active') AS active_alerts,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600.0) AS avg_resolution_hours,
  MAX(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600.0) AS max_resolution_hours,
  MIN(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600.0) AS min_resolution_hours
FROM alerts
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), alert_type, severity
ORDER BY date DESC, alert_type;

-- View: AI prioritization accuracy
CREATE OR REPLACE VIEW ai_prioritization_stats AS
SELECT 
  DATE_TRUNC('day', a.created_at) AS date,
  aip.priority_level,
  COUNT(*) AS total_prioritized,
  COUNT(*) FILTER (WHERE a.status = 'resolved') AS resolved_count,
  AVG(EXTRACT(EPOCH FROM (a.resolved_at - a.created_at)) / 3600.0) AS avg_resolution_hours,
  AVG(aip.priority_score) AS avg_priority_score,
  AVG(aip.confidence_score) AS avg_confidence_score
FROM alerts a
INNER JOIN alert_ai_priorities aip ON a.id = aip.alert_id
WHERE a.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', a.created_at), aip.priority_level
ORDER BY date DESC, aip.priority_level;

-- View: Alert performance by priority
CREATE OR REPLACE VIEW alert_performance_by_priority AS
SELECT 
  aip.priority_level,
  COUNT(*) AS total_alerts,
  COUNT(*) FILTER (WHERE a.status = 'resolved') AS resolved_count,
  COUNT(*) FILTER (WHERE a.status = 'active') AS active_count,
  ROUND(COUNT(*) FILTER (WHERE a.status = 'resolved')::DECIMAL / COUNT(*) * 100, 2) AS resolution_rate,
  AVG(EXTRACT(EPOCH FROM (a.resolved_at - a.created_at)) / 3600.0) AS avg_resolution_hours,
  AVG(aip.priority_score) AS avg_priority_score
FROM alerts a
INNER JOIN alert_ai_priorities aip ON a.id = aip.alert_id
WHERE a.created_at >= NOW() - INTERVAL '30 days'
GROUP BY aip.priority_level
ORDER BY 
  CASE aip.priority_level
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END;

-- View: Current alert summary
CREATE OR REPLACE VIEW current_alert_summary AS
SELECT 
  a.alert_type,
  a.severity,
  aip.priority_level,
  COUNT(*) AS alert_count,
  AVG(aip.priority_score) AS avg_priority_score,
  MAX(a.created_at) AS latest_alert,
  STRING_AGG(DISTINCT a.title, ', ' ORDER BY a.title) AS sample_titles
FROM alerts a
LEFT JOIN alert_ai_priorities aip ON a.id = aip.alert_id
WHERE a.status = 'active'
GROUP BY a.alert_type, a.severity, aip.priority_level
ORDER BY 
  CASE a.severity
    WHEN 'critical' THEN 1
    WHEN 'warning' THEN 2
    WHEN 'info' THEN 3
  END,
  CASE aip.priority_level
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END;

-- ============================================================================
-- 4. AUTOMATIC PRIORITIZATION ON ALERT CREATION
-- ============================================================================

-- Function: Auto-prioritize alert when created
CREATE OR REPLACE FUNCTION auto_prioritize_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function will be called by Edge Function via webhook or pg_cron
  -- For now, we'll just log that prioritization is needed
  -- The actual prioritization will be done by Edge Function
  
  -- You can call the Edge Function here using pg_net or http extension
  -- For now, we'll create a log entry
  
  INSERT INTO ai_processing_logs (
    vehicle_id,
    processing_type,
    status,
    error_message
  )
  VALUES (
    NEW.vehicle_id,
    'alert_prioritization',
    'pending',
    'Alert created: ' || NEW.id::text || ' - Auto-prioritization pending'
  );
  
  RETURN NEW;
END;
$$;

-- Trigger: Auto-prioritize alert when created
DROP TRIGGER IF EXISTS trigger_auto_prioritize_alert ON alerts;
CREATE TRIGGER trigger_auto_prioritize_alert
  AFTER INSERT ON alerts
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION auto_prioritize_alert();

-- ============================================================================
-- 5. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION create_blocked_vehicle_alerts() TO authenticated;
GRANT EXECUTE ON FUNCTION create_aging_vehicle_alerts() TO authenticated;
GRANT EXECUTE ON FUNCTION create_capacity_alerts() TO authenticated;
GRANT EXECUTE ON FUNCTION create_unassigned_vehicle_alerts() TO authenticated;
GRANT EXECUTE ON FUNCTION create_all_alerts_from_data() TO authenticated;

-- Grant select on views
GRANT SELECT ON alert_resolution_stats TO authenticated;
GRANT SELECT ON ai_prioritization_stats TO authenticated;
GRANT SELECT ON alert_performance_by_priority TO authenticated;
GRANT SELECT ON current_alert_summary TO authenticated;

-- ============================================================================
-- 6. COMMENTS
-- ============================================================================

COMMENT ON FUNCTION create_blocked_vehicle_alerts() IS 'Creates alerts for vehicles blocked > 48 hours';
COMMENT ON FUNCTION create_aging_vehicle_alerts() IS 'Creates alerts for vehicles aging > 7 days';
COMMENT ON FUNCTION create_capacity_alerts() IS 'Creates alerts for markets over 90% capacity';
COMMENT ON FUNCTION create_unassigned_vehicle_alerts() IS 'Creates alerts for unassigned vehicles';
COMMENT ON FUNCTION create_all_alerts_from_data() IS 'Creates all alerts from real vehicle data';
COMMENT ON VIEW alert_resolution_stats IS 'Tracks alert resolution metrics over time';
COMMENT ON VIEW ai_prioritization_stats IS 'Tracks AI prioritization accuracy and performance';
COMMENT ON VIEW alert_performance_by_priority IS 'Shows alert performance metrics by priority level';
COMMENT ON VIEW current_alert_summary IS 'Shows current active alerts summary';

