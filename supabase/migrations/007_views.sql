-- Dashboard Views
-- Pre-computed aggregations for dashboard KPIs

-- View: Dashboard KPIs
CREATE VIEW dashboard_kpis AS
SELECT
  COUNT(*) FILTER (WHERE status = 'Located') as located_count,
  COUNT(*) FILTER (WHERE status = 'Blocked') as blocked_count,
  COUNT(*) FILTER (WHERE status = 'Stashed') as stashed_count,
  COUNT(*) FILTER (WHERE status = 'Dispatched') as dispatched_count,
  COUNT(*) FILTER (WHERE status = 'Towed') as towed_count,
  COUNT(*) FILTER (WHERE source ILIKE '%BANK GPS%' OR source = 'BANK') as bank_gps_count,
  AVG(EXTRACT(EPOCH FROM (NOW() - located_at))/86400) 
    FILTER (WHERE status IN ('Located', 'Blocked', 'Stashed')) as avg_age_days,
  COUNT(*) FILTER (WHERE status IN ('Located', 'Blocked', 'Stashed') 
    AND (NOW() - located_at) > INTERVAL '5 days') as five_plus_days
FROM located_vehicles
WHERE market_id IS NOT NULL;

-- View: By Client breakdown
CREATE VIEW dashboard_by_client AS
SELECT
  c.id as client_id,
  c.code as client_code,
  c.name as client_name,
  COUNT(*) as total_vehicles,
  COUNT(*) FILTER (WHERE lv.status = 'Located') as located_count,
  COUNT(*) FILTER (WHERE lv.status = 'Blocked') as blocked_count,
  COUNT(*) FILTER (WHERE lv.status = 'Stashed') as stashed_count,
  COUNT(*) FILTER (WHERE lv.status = 'Dispatched') as dispatched_count,
  COUNT(*) FILTER (WHERE lv.status = 'Towed') as towed_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as percentage
FROM clients c
LEFT JOIN located_vehicles lv ON lv.client_id = c.id
WHERE c.is_active = true
GROUP BY c.id, c.code, c.name;

-- View: By Market breakdown
CREATE VIEW dashboard_by_market AS
SELECT
  m.id as market_id,
  m.code as market_code,
  m.name as market_name,
  COUNT(*) as total_vehicles,
  COUNT(*) FILTER (WHERE lv.status = 'Located') as located_count,
  COUNT(*) FILTER (WHERE lv.status = 'Blocked') as blocked_count,
  COUNT(*) FILTER (WHERE lv.status = 'Stashed') as stashed_count,
  COUNT(*) FILTER (WHERE lv.status = 'Dispatched') as dispatched_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as percentage
FROM markets m
LEFT JOIN located_vehicles lv ON lv.market_id = m.id
WHERE m.is_active = true
GROUP BY m.id, m.code, m.name;

-- View: Awaiting tow by driver
CREATE VIEW awaiting_tow_by_driver AS
SELECT
  d.id as driver_id,
  d.name as driver_name,
  COUNT(*) as awaiting_count,
  COUNT(*) FILTER (WHERE lv.status = 'Located') as located_count,
  COUNT(*) FILTER (WHERE lv.status = 'Blocked') as blocked_count,
  COUNT(*) FILTER (WHERE lv.status = 'Stashed') as stashed_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as percentage
FROM drivers d
LEFT JOIN located_vehicles lv ON lv.assigned_driver_id = d.id
WHERE lv.status IN ('Located', 'Blocked', 'Stashed')
  AND d.status = 'active'
GROUP BY d.id, d.name;

-- View: Detailed breakdown matrix (Client × Zone × Driver)
CREATE VIEW dashboard_matrix AS
SELECT
  c.name as client,
  COALESCE(z.name, 'Unknown') as zone,
  COALESCE(d.name, 'Unassigned') as driver,
  COUNT(*) as vehicle_count,
  COUNT(*) FILTER (WHERE lv.status = 'Located') as located_count,
  COUNT(*) FILTER (WHERE lv.status = 'Blocked') as blocked_count,
  COUNT(*) FILTER (WHERE lv.status = 'Stashed') as stashed_count,
  SUM(vehicle_count) OVER () as total
FROM located_vehicles lv
JOIN clients c ON c.id = lv.client_id
LEFT JOIN zones z ON z.id = lv.zone_id
LEFT JOIN drivers d ON d.id = lv.assigned_driver_id
WHERE lv.status IN ('Located', 'Blocked', 'Stashed')
GROUP BY c.name, z.name, d.name;

-- View: Zone capacity summary
CREATE VIEW zone_capacity_summary AS
SELECT
  m.name as market,
  z.name as zone,
  z.code as zone_code,
  d.shift_type,
  COUNT(DISTINCT d.id) as driver_count,
  SUM(d.max_capacity) as total_capacity,
  COUNT(lv.id) as assigned_count,
  SUM(d.max_capacity) - COUNT(lv.id) as remaining_capacity,
  ROUND(100.0 * COUNT(lv.id) / NULLIF(SUM(d.max_capacity), 0), 1) as utilization_pct
FROM markets m
JOIN zones z ON z.market_id = m.id
LEFT JOIN drivers d ON d.zone_id = z.id AND d.status = 'active'
LEFT JOIN located_vehicles lv ON lv.zone_id = z.id 
  AND lv.status IN ('Located', 'Blocked', 'Stashed')
WHERE m.is_active = true AND z.is_active = true
GROUP BY m.id, m.name, z.id, z.name, z.code, d.shift_type;

-- Grant access to all views
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;


