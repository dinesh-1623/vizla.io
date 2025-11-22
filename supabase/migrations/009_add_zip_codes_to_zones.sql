-- Add zip_codes column to zones table
-- This stores an array of zip codes that belong to each zone

ALTER TABLE zones 
ADD COLUMN IF NOT EXISTS zip_codes TEXT[] DEFAULT '{}';

-- Create index for zip code searches
CREATE INDEX IF NOT EXISTS idx_zones_zip_codes ON zones USING GIN(zip_codes);

-- Add comment
COMMENT ON COLUMN zones.zip_codes IS 'Array of zip codes that fall within this zone boundary';

