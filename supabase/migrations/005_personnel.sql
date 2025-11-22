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
  USING (is_admin() OR get_user_role() = 'dispatcher');

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


