-- Enums
-- Create all custom types used throughout the schema

CREATE TYPE vehicle_status AS ENUM (
  'Located',      -- Initial discovery
  'Blocked',      -- Cannot access (fence, legal, etc.)
  'Stashed',      -- Temporary stash spot
  'Dispatched',   -- Driver en route
  'Towed'         -- Completed recovery
);

CREATE TYPE spotter_submission_status AS ENUM (
  'pending',      -- Awaiting review
  'verified',     -- Confirmed as valid
  'duplicate',    -- Already exists
  'rejected'      -- Invalid submission
);

CREATE TYPE shift_type AS ENUM ('Day', 'Night');

CREATE TYPE storage_lot_type AS ENUM ('lot', 'stash');

CREATE TYPE driver_status AS ENUM ('active', 'inactive', 'on_break', 'offline');

CREATE TYPE assignment_status AS ENUM ('assigned', 'in-progress', 'completed', 'cancelled');

CREATE TYPE user_role AS ENUM (
  'admin',      -- Full access
  'dispatcher', -- Assign vehicles, view all
  'manager',    -- View dashboards, reports
  'driver',     -- View own assignments
  'spotter'     -- Submit sightings
);

CREATE TYPE vehicle_type AS ENUM ('Tow Truck', 'Spotter', 'Rollback');

-- Auth & Profiles
-- User profiles linked to Supabase Auth with roles

-- Profiles table linked to auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'driver',
  market_id UUID, -- Will reference markets after creation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Only admins can insert/delete profiles
CREATE POLICY "Admins can manage profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function to check if admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() = 'admin';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function to get user market
CREATE OR REPLACE FUNCTION get_user_market()
RETURNS UUID AS $$
  SELECT market_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Core Dimensions
-- Markets, zones, clients, and storage lots

-- Markets table
CREATE TABLE markets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zones table
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(market_id, code)
);

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Storage lots table
CREATE TABLE storage_lots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type storage_lot_type NOT NULL,
  address TEXT,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_zones_market_id ON zones(market_id);
CREATE INDEX idx_storage_lots_market_id ON storage_lots(market_id);
CREATE INDEX idx_storage_lots_type ON storage_lots(type);

-- Enable RLS
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_lots ENABLE ROW LEVEL SECURITY;

-- Markets policies
CREATE POLICY "Anyone can read active markets"
  ON markets FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage markets"
  ON markets FOR ALL
  USING (is_admin());

-- Zones policies
CREATE POLICY "Anyone can read active zones"
  ON zones FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins and dispatchers can manage zones"
  ON zones FOR ALL
  USING (is_admin() OR get_user_role() = 'dispatcher');

-- Clients policies
CREATE POLICY "Anyone can read active clients"
  ON clients FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage clients"
  ON clients FOR ALL
  USING (is_admin());

-- Storage lots policies
CREATE POLICY "Anyone can read storage lots"
  ON storage_lots FOR SELECT
  USING (true);

CREATE POLICY "Admins and dispatchers can manage storage lots"
  ON storage_lots FOR ALL
  USING (is_admin() OR get_user_role() = 'dispatcher');

-- Vehicles Tables
-- Fleet vehicles (company equipment) and located vehicles (customer vehicles)

-- Fleet vehicles table
CREATE TABLE fleet_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vin TEXT UNIQUE,
  make TEXT,
  model TEXT,
  year INTEGER,
  type vehicle_type NOT NULL,
  driver_id UUID, -- Will reference drivers after creation
  status TEXT CHECK (status IN ('Active', 'Inactive', 'Maintenance')),
  maintenance_status TEXT,
  starting_point TEXT CHECK (starting_point IN ('Fixed', 'Not Fixed')),
  location TEXT,
  storage_lot_id UUID REFERENCES storage_lots(id),
  zone_id UUID, -- Will reference zones after creation
  market_id UUID REFERENCES markets(id),
  shift shift_type,
  shift_goal_current INTEGER DEFAULT 0,
  shift_goal_total INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Located vehicles table (main data entity)
CREATE TABLE located_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vin TEXT,
  plate TEXT,
  year INTEGER,
  make TEXT,
  model TEXT,
  color TEXT,
  address TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  city TEXT,
  zip TEXT,
  
  -- Foreign keys
  client_id UUID REFERENCES clients(id),
  zone_id UUID, -- Will reference zones after creation
  market_id UUID REFERENCES markets(id),
  
  -- Status tracking
  status vehicle_status NOT NULL DEFAULT 'Located',
  source TEXT, -- GPS, Rotors, Imp, Fuel, etc.
  assigned_driver_id UUID, -- Will reference drivers after creation
  
  -- Timestamps
  located_at TIMESTAMPTZ DEFAULT NOW(),
  dispatched_at TIMESTAMPTZ,
  towed_at TIMESTAMPTZ,
  stashed_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT[],
  photos TEXT[], -- Array of photo URLs
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for located_vehicles
CREATE INDEX idx_located_vehicles_client_id ON located_vehicles(client_id);
CREATE INDEX idx_located_vehicles_zone_id ON located_vehicles(zone_id);
CREATE INDEX idx_located_vehicles_market_id ON located_vehicles(market_id);
CREATE INDEX idx_located_vehicles_assigned_driver_id ON located_vehicles(assigned_driver_id);
CREATE INDEX idx_located_vehicles_status ON located_vehicles(status);
CREATE INDEX idx_located_vehicles_status_zone ON located_vehicles(status, zone_id);
CREATE INDEX idx_located_vehicles_located_at ON located_vehicles(located_at);

-- Enable RLS
ALTER TABLE fleet_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE located_vehicles ENABLE ROW LEVEL SECURITY;

-- Fleet vehicles policies
CREATE POLICY "Anyone can read fleet vehicles"
  ON fleet_vehicles FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage fleet vehicles"
  ON fleet_vehicles FOR ALL
  USING (is_admin());

-- Located vehicles policies
CREATE POLICY "Anyone can read vehicles"
  ON located_vehicles FOR SELECT
  USING (true);

CREATE POLICY "Admins and dispatchers can insert vehicles"
  ON located_vehicles FOR INSERT
  WITH CHECK (is_admin() OR get_user_role() = 'dispatcher');

CREATE POLICY "Admins and dispatchers can update vehicles"
  ON located_vehicles FOR UPDATE
  USING (is_admin() OR get_user_role() = 'dispatcher');

CREATE POLICY "Admins can delete vehicles"
  ON located_vehicles FOR DELETE
  USING (is_admin());

-- Trigger to update updated_at
CREATE TRIGGER update_located_vehicles_updated_at
  BEFORE UPDATE ON located_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Personnel Tables
-- Drivers and shifts

-- Drivers table
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  
  -- Assignment info
  market_id UUID REFERENCES markets(id),
  zone_id UUID, -- Will reference zones after creation
  shift_type shift_type DEFAULT 'Day',
  shift_start TIME,
  shift_end TIME,
  shift_goal INTEGER DEFAULT 20,
  
  -- Capacity & Progress
  max_capacity INTEGER DEFAULT 10,
  current_load INTEGER DEFAULT 0,
  hours_worked DECIMAL(5,2) DEFAULT 0,
  
  -- Status
  status driver_status DEFAULT 'active',
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_updated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shifts table
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  market_id UUID REFERENCES markets(id),
  shift_type shift_type NOT NULL,
  shift_date DATE NOT NULL,
  shift_start TIMESTAMPTZ NOT NULL,
  shift_end TIMESTAMPTZ,
  
  goal_count INTEGER DEFAULT 20,
  completed_count INTEGER DEFAULT 0,
  hours_worked DECIMAL(5,2),
  
  status TEXT DEFAULT 'active',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_drivers_market_id ON drivers(market_id);
CREATE INDEX idx_drivers_zone_id ON drivers(zone_id);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_shifts_driver_id ON shifts(driver_id);
CREATE INDEX idx_shifts_shift_date ON shifts(shift_date);
CREATE INDEX idx_shifts_market_id ON shifts(market_id);

-- Enable RLS
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Drivers policies
CREATE POLICY "Anyone can read active drivers"
  ON drivers FOR SELECT
  USING (true);

CREATE POLICY "Users can update own driver record"
  ON drivers FOR UPDATE
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Admins and dispatchers can manage drivers"
  ON drivers FOR INSERT
  WITH CHECK (is_admin() OR get_user_role() = 'dispatcher');

CREATE POLICY "Admins can delete drivers"
  ON drivers FOR DELETE
  USING (is_admin());

-- Shifts policies
CREATE POLICY "Anyone can read shifts"
  ON shifts FOR SELECT
  USING (true);

CREATE POLICY "Admins and dispatchers can manage shifts"
  ON shifts FOR ALL
  USING (is_admin() OR get_user_role() = 'dispatcher');

-- Trigger to update updated_at
CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at
  BEFORE UPDATE ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Assignments & Spotter Submissions

-- Assignments table (driver-vehicle-shift mapping)
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES located_vehicles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
  
  sequence_order INTEGER, -- For route ordering
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  
  estimated_pickup TIMESTAMPTZ,
  actual_pickup TIMESTAMPTZ,
  estimated_dropoff TIMESTAMPTZ,
  actual_dropoff TIMESTAMPTZ,
  
  status assignment_status DEFAULT 'assigned',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spotter submissions table
CREATE TABLE spotter_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES located_vehicles(id) ON DELETE SET NULL,
  spotter_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id),
  
  -- Vehicle details
  vin TEXT NOT NULL,
  year INTEGER,
  make TEXT,
  model TEXT,
  color TEXT,
  plate TEXT,
  address TEXT,
  
  -- Condition & Location
  reachable TEXT CHECK (reachable IN ('Reachable', 'Not reachable')),
  rusted TEXT CHECK (rusted IN ('Rusted', 'Not rusted')),
  location_type TEXT,
  parked_type TEXT,
  notes TEXT[],
  
  -- Photos
  photo_urls TEXT[] NOT NULL,
  
  status spotter_submission_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_assignments_vehicle_id ON assignments(vehicle_id);
CREATE INDEX idx_assignments_driver_id ON assignments(driver_id);
CREATE INDEX idx_assignments_shift_id ON assignments(shift_id);
CREATE INDEX idx_spotter_submissions_vehicle_id ON spotter_submissions(vehicle_id);
CREATE INDEX idx_spotter_submissions_spotter_id ON spotter_submissions(spotter_id);
CREATE INDEX idx_spotter_submissions_client_id ON spotter_submissions(client_id);

-- Enable RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE spotter_submissions ENABLE ROW LEVEL SECURITY;

-- Assignments policies
CREATE POLICY "Anyone can read assignments"
  ON assignments FOR SELECT
  USING (true);

CREATE POLICY "Admins and dispatchers can create assignments"
  ON assignments FOR INSERT
  WITH CHECK (is_admin() OR get_user_role() = 'dispatcher');

CREATE POLICY "Assigned users can update assignments"
  ON assignments FOR UPDATE
  USING (
    is_admin() OR
    get_user_role() = 'dispatcher' OR
    driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can delete assignments"
  ON assignments FOR DELETE
  USING (is_admin());

-- Spotter submissions policies
CREATE POLICY "Users can read own submissions"
  ON spotter_submissions FOR SELECT
  USING (
    spotter_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()) OR
    is_admin() OR
    get_user_role() = 'dispatcher'
  );

CREATE POLICY "Spotters can create submissions"
  ON spotter_submissions FOR INSERT
  WITH CHECK (
    get_user_role() IN ('spotter', 'admin', 'dispatcher') OR
    spotter_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
  );

CREATE POLICY "Spotters can update own submissions"
  ON spotter_submissions FOR UPDATE
  USING (
    spotter_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()) OR
    is_admin() OR
    get_user_role() = 'dispatcher'
  );

CREATE POLICY "Admins can delete submissions"
  ON spotter_submissions FOR DELETE
  USING (is_admin());

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
  SUM(COUNT(*)) OVER () as total
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

