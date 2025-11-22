# 🚀 Quick Guide: Extract Zip Codes for Zones

## Problem
You're seeing "No zip codes assigned" for all zones on the map.

## Solution
You need to extract zip codes first! Here's how:

### Step 1: Go to Zones Admin Page
1. Navigate to **Admin → Zones** in your app
2. You'll see a list of all zones

### Step 2: Extract Zip Codes
1. Click the **"Extract Zip Codes"** button (top right, next to Export)
2. A dialog will open explaining the process
3. Click **"Extract Zip Codes"** button in the dialog
4. Wait for the extraction to complete (you'll see progress messages)

### Step 3: What Happens
The system will:
- ✅ Parse your KML file (`/data/my-zones.kml`)
- ✅ Load all vehicles from database
- ✅ Match vehicles to zones using:
  - Direct `zone_id` assignments
  - KML polygon boundaries (point-in-polygon check)
- ✅ Extract unique zip codes for each zone
- ✅ Save to database

### Step 4: View on Map
1. Go back to **Operations Map**
2. Make sure **"Show Zones"** toggle is ON
3. Zip codes will now appear as labels at the center of each zone!

## Troubleshooting

### No zip codes found?
- **Check vehicles have coordinates**: Vehicles need `lat`, `lng`, and `zip` fields
- **Check zone names match**: KML zone names should match database zone names (or be similar)
- **Check console**: Open browser DevTools (F12) to see extraction progress

### Zone names don't match?
The system now uses flexible matching:
- "TX - SW 1 (JOHN L)" will match "SW 1" or "SW1"
- Case-insensitive matching
- Partial name matching

### Still not working?
1. Check browser console for errors
2. Verify KML file exists at `/public/data/my-zones.kml`
3. Verify zones exist in database (Admin → Zones page)
4. Verify vehicles have zip codes in database

## Next Steps After Extraction

Once zip codes are extracted:
- ✅ They'll appear on the map automatically
- ✅ Click any zone to see all zip codes
- ✅ Zip codes are stored in database, so they persist

