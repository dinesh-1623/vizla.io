-- Helper Functions
-- Utility functions for calculations and queries

-- Haversine distance function (calculate distance between two points)
CREATE OR REPLACE FUNCTION haversine_km(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  earth_radius_km DECIMAL := 6371;
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  a := sin(dlat/2) * sin(dlat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dlon/2) * sin(dlon/2);
  
  RETURN earth_radius_km * 2 * asin(sqrt(a));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Find nearest storage lot to a location
CREATE OR REPLACE FUNCTION find_nearest_storage_lot(
  p_lat DECIMAL,
  p_lng DECIMAL,
  p_market_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type storage_lot_type,
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sl.id,
    sl.name,
    sl.type,
    haversine_km(p_lat, p_lng, sl.lat, sl.lng) as distance_km
  FROM storage_lots sl
  WHERE sl.is_active = true
    AND (p_market_id IS NULL OR sl.market_id = p_market_id)
  ORDER BY distance_km
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get shift capacity for a driver
CREATE OR REPLACE FUNCTION get_shift_capacity(p_driver_id UUID)
RETURNS TABLE (
  current_load INTEGER,
  max_capacity INTEGER,
  remaining_capacity INTEGER,
  utilization_pct DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.current_load,
    d.max_capacity,
    (d.max_capacity - d.current_load) as remaining_capacity,
    ROUND(100.0 * d.current_load / NULLIF(d.max_capacity, 0), 1) as utilization_pct
  FROM drivers d
  WHERE d.id = p_driver_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Update driver location
CREATE OR REPLACE FUNCTION update_driver_location(
  p_driver_id UUID,
  p_lat DECIMAL,
  p_lng DECIMAL
)
RETURNS VOID AS $$
BEGIN
  UPDATE drivers
  SET
    location_lat = p_lat,
    location_lng = p_lng,
    location_updated_at = NOW()
  WHERE id = p_driver_id;
END;
$$ LANGUAGE plpgsql;

-- Calculate route time estimate (placeholder for future implementation)
CREATE OR REPLACE FUNCTION estimate_route_time(
  p_vehicle_ids UUID[]
)
RETURNS DECIMAL AS $$
DECLARE
  avg_speed_mph DECIMAL := 22; -- Average city speed
  hookup_time_min DECIMAL := 10; -- Per pickup
  drop_time_min DECIMAL := 10; -- Per drop
BEGIN
  -- Placeholder: Simple calculation
  -- In production, integrate with Google Maps Distance Matrix API
  RETURN (
    array_length(p_vehicle_ids, 1) * (hookup_time_min + drop_time_min)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get vehicles by filters
CREATE OR REPLACE FUNCTION get_vehicles_filtered(
  p_market_id UUID DEFAULT NULL,
  p_zone_id UUID DEFAULT NULL,
  p_client_id UUID DEFAULT NULL,
  p_status vehicle_status DEFAULT NULL,
  p_driver_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  vin TEXT,
  plate TEXT,
  year INTEGER,
  make TEXT,
  model TEXT,
  color TEXT,
  address TEXT,
  status vehicle_status,
  source TEXT,
  client_name TEXT,
  zone_name TEXT,
  driver_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lv.id,
    lv.vin,
    lv.plate,
    lv.year,
    lv.make,
    lv.model,
    lv.color,
    lv.address,
    lv.status,
    lv.source,
    c.name as client_name,
    z.name as zone_name,
    d.name as driver_name
  FROM located_vehicles lv
  LEFT JOIN clients c ON c.id = lv.client_id
  LEFT JOIN zones z ON z.id = lv.zone_id
  LEFT JOIN drivers d ON d.id = lv.assigned_driver_id
  WHERE (p_market_id IS NULL OR lv.market_id = p_market_id)
    AND (p_zone_id IS NULL OR lv.zone_id = p_zone_id)
    AND (p_client_id IS NULL OR lv.client_id = p_client_id)
    AND (p_status IS NULL OR lv.status = p_status)
    AND (p_driver_id IS NULL OR lv.assigned_driver_id = p_driver_id)
  ORDER BY lv.located_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION haversine_km TO anon, authenticated;
GRANT EXECUTE ON FUNCTION find_nearest_storage_lot TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_shift_capacity TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_driver_location TO authenticated;
GRANT EXECUTE ON FUNCTION estimate_route_time TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_vehicles_filtered TO anon, authenticated;


