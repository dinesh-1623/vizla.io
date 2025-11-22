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
  USING (is_admin() OR get_user_role() = 'dispatcher');

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


