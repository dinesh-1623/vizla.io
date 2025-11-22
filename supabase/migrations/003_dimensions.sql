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


