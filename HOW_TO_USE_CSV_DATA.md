# How to Use Generated CSV Data Files

This guide explains how to use the CSV files generated from ChatGPT to populate your Supabase database.

---

## Step 1: Generate CSV Files

1. Open `DATA_GENERATION_PROMPT_CSV.md`
2. Copy the entire prompt
3. Paste into ChatGPT (or similar AI tool)
4. ChatGPT will generate CSV files for you
5. Save each CSV file to your `public/data/` folder

---

## Step 2: Upload CSV Files

Place all generated CSV files in the `public/data/` directory:

```
public/data/
  ├── markets-zones.csv
  ├── clients.csv
  ├── storage-lots.csv
  ├── drivers.csv
  ├── fleet-vehicles.csv
  ├── located-vehicles.csv
  ├── user-profiles.csv (optional)
  └── spotter-submissions.csv (optional)
```

---

## Step 3: Update Seeding Script (if needed)

Your existing seeding script (`scripts/seed-from-csv.ts`) currently expects:
- ✅ `markets-zones.csv` - Already supported
- ✅ `clients.json` - You may want to convert clients.csv to JSON or update script
- ✅ `storage-lots.json` - You may want to convert storage-lots.csv to JSON or update script
- ✅ `located-vehicles.csv` - Already supported

### Option A: Convert CSV to JSON (Quick)
For clients and storage-lots, you can use a CSV-to-JSON converter online, or modify the script.

### Option B: Update Script (Better)
Update `scripts/seed-from-csv.ts` to read CSV files for clients and storage-lots instead of JSON.

---

## Step 4: Run Seeding Script

### Prerequisites:
1. Make sure you have `.env` file with Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Run the Script:
```bash
npm run db:seed
# OR
ts-node scripts/seed-from-csv.ts
```

The script will:
1. ✅ Read CSV files from `public/data/`
2. ✅ Upsert markets and zones
3. ✅ Upsert clients
4. ✅ Upsert storage lots
5. ✅ Upsert located vehicles

---

## Step 5: Verify Data

1. **Check Supabase Dashboard:**
   - Open your Supabase project
   - Go to Table Editor
   - Verify tables have data:
     - `markets` (4 records)
     - `zones` (12-20 records)
     - `clients` (15-25 records)
     - `storage_lots` (8-16 records)
     - `located_vehicles` (200-300 records)

2. **Test Your Application:**
   - Open your app
   - Navigate to different views
   - Verify data appears correctly
   - Check filters work
   - Verify maps show vehicles

---

## Step 6: Manual Data Insertion (Alternative)

If the seeding script doesn't cover all tables, you can:

### Option 1: Use Supabase SQL Editor
1. Open Supabase Dashboard → SQL Editor
2. Convert CSV data to SQL INSERT statements
3. Run SQL directly

### Option 2: Use Supabase Dashboard Import
1. Open Supabase Dashboard → Table Editor
2. Select a table
3. Use "Insert" → "Import CSV" (if available)

### Option 3: Write Custom Script
Create additional seeding functions for:
- Drivers
- Fleet Vehicles
- User Profiles
- Spotter Submissions
- Shifts
- Assignments

---

## Handling Additional Tables

For tables not covered by the current seeding script, you'll need to:

### Drivers Table
```typescript
// Add to seed-from-csv.ts
async function seedDrivers() {
  const filePath = path.join(process.cwd(), 'public/data/drivers.csv');
  const data = parseCSV(filePath);
  
  // Get markets and zones for mapping
  const { data: markets } = await supabase.from('markets').select('id, name');
  const { data: zones } = await supabase.from('zones').select('id, code, name');
  
  const marketMap = new Map(markets?.map(m => [m.name, m.id]) || []);
  const zoneMap = new Map(zones?.map(z => [z.code, z.id]) || []);
  
  for (const row of data) {
    await supabase.from('drivers').insert({
      name: row.name,
      email: row.email,
      phone: row.phone,
      market_id: marketMap.get(row.market),
      zone_id: zoneMap.get(row.zone),
      shift_type: row.shift_type,
      shift_start: row.shift_start,
      shift_end: row.shift_end,
      shift_goal: parseInt(row.shift_goal),
      max_capacity: parseInt(row.max_capacity),
      status: row.status,
      location_lat: parseFloat(row.location_lat),
      location_lng: parseFloat(row.location_lng)
    });
  }
}
```

### Fleet Vehicles Table
Similar pattern - read CSV, map to foreign keys, insert.

---

## CSV File Format Requirements

### Headers Must Match Exactly:
- `markets-zones.csv`: `market,zone,code,is_active`
- `clients.csv`: See DATA_GENERATION_PROMPT_CSV.md for exact format
- `drivers.csv`: See DATA_GENERATION_PROMPT_CSV.md for exact format
- etc.

### Encoding:
- Use UTF-8 encoding
- Use standard line endings (LF or CRLF)
- Escape commas and quotes properly

### Required Fields:
- Don't leave required fields empty
- Use null/empty strings appropriately
- Match foreign key values exactly

---

## Troubleshooting

### Issue: "Foreign key constraint violated"
**Solution**: Ensure CSV files are loaded in order:
1. Markets first
2. Zones (needs markets)
3. Clients (no dependency)
4. Storage Lots (needs markets)
5. Drivers (needs markets/zones)
6. Vehicles (needs clients/markets/zones)

### Issue: "Duplicate key error"
**Solution**: The script uses `upsert` which handles duplicates. If issues persist:
- Check CSV for duplicate IDs/VINs
- Clear existing data first (be careful!)

### Issue: "Coordinates out of range"
**Solution**: 
- Verify coordinates are within market bounds
- Check lat/lng format (should be decimal, not DMS)

### Issue: "Date format error"
**Solution**:
- Use ISO format: `2024-01-15T10:30:00Z`
- Or let database use `NOW()` defaults

---

## Next Steps After Seeding

1. **Update Foreign Keys**: 
   - Located vehicles may need zone_id set
   - Assignments need to link vehicles to drivers

2. **Create Shifts**:
   - Generate shift records for drivers
   - Link to assignments

3. **Set Up Authentication**:
   - Create Supabase auth users matching user-profiles.csv
   - Link profiles to auth.users

4. **Test Application**:
   - Verify all views work
   - Test filtering and searching
   - Check map views
   - Verify dashboard metrics

---

## Quick Reference

**File Locations:**
- CSV files: `public/data/*.csv`
- Seeding script: `scripts/seed-from-csv.ts`
- Environment: `.env`

**Key Commands:**
```bash
# Install dependencies
npm install

# Run seeding
npm run db:seed

# Check Supabase
# Open: https://app.supabase.com
```

**Database Tables (in order of dependency):**
1. markets (no dependency)
2. zones (needs markets)
3. clients (no dependency)
4. storage_lots (needs markets)
5. profiles (needs auth.users)
6. drivers (needs profiles, markets, zones)
7. fleet_vehicles (needs markets, zones, storage_lots, drivers)
8. located_vehicles (needs clients, markets, zones, drivers)
9. shifts (needs drivers, markets)
10. assignments (needs vehicles, drivers, shifts)
11. spotter_submissions (needs clients, drivers)

---

## Support

If you encounter issues:
1. Check CSV file formats match the prompt specifications
2. Verify all foreign key relationships are correct
3. Check Supabase logs for detailed error messages
4. Ensure environment variables are set correctly
5. Review the seeding script console output


