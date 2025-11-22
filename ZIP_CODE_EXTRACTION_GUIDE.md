# Zip Code Extraction Guide

## Overview

This feature extracts zip codes for each zone by analyzing:
1. **KML Zone Boundaries** - Parses your `my-zones.kml` file to get zone polygon boundaries
2. **Located Vehicles** - Matches vehicles to zones based on coordinates and zone assignments
3. **Zip Code Aggregation** - Collects all unique zip codes for each zone

## How It Works

### Step 1: Apply Database Migration

First, add the `zip_codes` column to your zones table:

```sql
-- Run this in Supabase SQL Editor
ALTER TABLE zones 
ADD COLUMN IF NOT EXISTS zip_codes TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_zones_zip_codes ON zones USING GIN(zip_codes);
```

Or use the migration file:
```bash
# The migration is in: supabase/migrations/009_add_zip_codes_to_zones.sql
```

### Step 2: Extract Zip Codes

1. Go to **Admin → Zones** page
2. Click the **"Extract Zip Codes"** button
3. The system will:
   - Parse your KML file (`/data/my-zones.kml`)
   - Match vehicles to zones using:
     - Direct zone_id assignments
     - KML polygon boundaries (point-in-polygon check)
   - Extract unique zip codes for each zone
   - Save to database

### Step 3: View Results

After extraction, each zone card will display:
- **Zip Codes Count**: Number of zip codes found
- **Zip Code Badges**: First 10 zip codes displayed
- **"+X more"**: If there are more than 10 zip codes

## Markets Supported

The extraction works for zones in:
- **Texas** (Dallas, Houston, etc.)
- **Washington** (DC area)
- **Baltimore** (Maryland)
- **Delaware**

## Zone Selector Component

Use the `ZoneSelector` component anywhere in your app:

```tsx
import { ZoneSelector } from '@/components/zone/ZoneSelector';

<ZoneSelector
  value={selectedZoneId}
  onValueChange={setSelectedZoneId}
  marketId={marketId} // Optional: filter by market
  showZipCodes={true} // Show zip code count in dropdown
/>
```

## Technical Details

### Extraction Methods

1. **Direct Assignment**: Uses `zone_id` from `located_vehicles` table
2. **KML Polygon Matching**: Uses point-in-polygon algorithm to match vehicles to zone boundaries
3. **Aggregation**: Collects all unique zip codes per zone

### KML File Format

Your KML file should have:
- `<Placemark>` elements with zone names
- `<coordinates>` with polygon boundaries (lng,lat format)
- Zone names matching your database zone names

### Performance

- Processes vehicles in batches
- Uses efficient point-in-polygon algorithm
- Indexes zip_codes column for fast queries

## Troubleshooting

### No Zip Codes Found

- **Check KML file**: Ensure `/data/my-zones.kml` exists and has valid zone boundaries
- **Check vehicle data**: Ensure `located_vehicles` has coordinates and zip codes
- **Check zone names**: KML zone names must match database zone names

### Missing Zip Codes

- Some zip codes may not appear if vehicles aren't assigned to zones
- Run the extraction after seeding vehicle data
- Check console logs for matching statistics

## API Functions

```typescript
// Extract zip codes for all zones
const zonesWithZipCodes = await extractZipCodesForZones();

// Get zip codes for a specific zone
const zipCodes = await getZipCodesForZone(zoneId);

// Get zip codes by market
const zipCodesByZone = await getZipCodesByMarket('Baltimore');
```

## Next Steps

1. Apply the migration to add `zip_codes` column
2. Run the extraction from the Zones page
3. Use `ZoneSelector` component in filters and forms
4. Filter vehicles by zone zip codes in queries

