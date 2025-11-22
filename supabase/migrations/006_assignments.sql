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
  USING (is_admin() OR get_user_role() = 'dispatcher');

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
  USING (
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


