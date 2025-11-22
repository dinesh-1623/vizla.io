# Complete Database Seeding Guide - New Data Replacement

## 🎯 Objective
Replace ALL existing data in your Supabase database with the new CSV data you've uploaded.

---

## ✅ Step 1: Verify CSV Files

All CSV files should be in `public/data/`:
- ✅ `markets-zones.csv`
- ✅ `clients.csv`
- ✅ `storage-lots.csv`
- ✅ `drivers.csv`
- ✅ `fleet-vehicles.csv`
- ✅ `located-vehicles.csv`
- ✅ `spotter-submissions.csv`
- ✅ `user-profiles.csv`

Verify they exist:
```bash
ls -la public/data/*.csv
```

---

## ✅ Step 2: Check Environment Variables

Ensure your `.env` file has Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Important:** You need the **SERVICE_ROLE_KEY** (not anon key) to delete and insert data.

---

## ✅ Step 3: Run Complete Seeding Script

This script will:
1. **DELETE all existing data** (clean slate)
2. **INSERT all new data** from CSV files
3. **Handle all relationships** properly
4. **Provide detailed logging**

```bash
npm run db:seed:complete
```

### What Happens:
- 🗑️ Clears existing data in correct order (respects foreign keys)
- 📊 Seeds markets and zones
- 👥 Seeds clients
- 🏢 Seeds storage lots
- 👨‍✈️ Seeds drivers
- 🚛 Seeds fleet vehicles
- 🚗 Seeds located vehicles (main data)
- 🔍 Seeds spotter submissions

### Expected Output:
```
🌱 Starting Complete Database Seeding...
📦 Supabase URL: https://...
🗑️  This will REPLACE all existing data

🗑️  Clearing existing data...
✅ Cleared spotter_submissions
✅ Cleared assignments
...
✅ Cleared markets

📊 Seeding Markets and Zones...
✅ Markets: 4 inserted | Zones: 20 inserted

👥 Seeding Clients...
✅ Clients: 20 inserted

🏢 Seeding Storage Lots...
✅ Storage Lots: 13 inserted

👨‍✈️ Seeding Drivers...
✅ Drivers: 11 inserted

🚛 Seeding Fleet Vehicles...
✅ Fleet Vehicles: 21 inserted

🚗 Seeding Located Vehicles...
  ✓ Processed 100 vehicles...
  ✓ Processed 200 vehicles...
✅ Located Vehicles: 242 inserted

🔍 Seeding Spotter Submissions...
✅ Spotter Submissions: 82 inserted

📊 SEEDING SUMMARY
============================================================
Markets:            4 inserted | 0 errors
Zones:              20 inserted | 0 errors
Clients:            20 inserted | 0 errors
Storage Lots:       13 inserted | 0 errors
Drivers:            11 inserted | 0 errors
Fleet Vehicles:     21 inserted | 0 errors
Located Vehicles:   242 inserted | 0 errors
Spotter Submissions: 82 inserted | 0 errors
============================================================

✨ Total: 413 records inserted
✅ Seeding complete!
```

---

## ✅ Step 4: Verify Data in Supabase

1. Open your Supabase Dashboard
2. Go to **Table Editor**
3. Check each table:
   - `markets` - Should have 4 records
   - `zones` - Should have ~20 records
   - `clients` - Should have ~20 records
   - `storage_lots` - Should have ~13 records
   - `drivers` - Should have ~11 records
   - `fleet_vehicles` - Should have ~21 records
   - `located_vehicles` - Should have ~242 records
   - `spotter_submissions` - Should have ~82 records

---

## ✅ Step 5: Test Your Application

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Verify data appears:**
   - Navigate to Dashboard - should show new data
   - Navigate to Located Dashboard - should show vehicles
   - Check markets/zones dropdowns - should show new markets
   - Verify maps show vehicles in correct locations

3. **Toggle Data Source:**
   - Click the database icon (🗄️) in header to toggle
   - Should default to **Supabase** now
   - All views should use Supabase data

---

## 🔧 Troubleshooting

### Issue: "Missing Supabase credentials"
**Solution:** Check your `.env` file has both:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_SERVICE_ROLE_KEY`

### Issue: "Foreign key constraint violated"
**Solution:** The script handles this automatically. If errors occur:
1. Run the script again (it's idempotent)
2. Check CSV files for invalid references
3. Verify all market/zone names match exactly

### Issue: "No data showing in app"
**Solution:**
1. Check data source is set to 'supabase':
   ```javascript
   localStorage.getItem('vizla-settings')
   ```
2. Verify Supabase tables have data
3. Check browser console for errors
4. Ensure Supabase RLS policies allow reading

### Issue: "Coordinates out of range"
**Solution:** CSV coordinates should be within market bounds:
- Baltimore: Lat 39.18-39.37, Lng -76.71 to -76.50
- Dallas: Lat 32.68-32.95, Lng -96.98 to -96.65
- Phoenix: Lat 33.30-33.65, Lng -112.20 to -111.85
- Atlanta: Lat 33.65-33.90, Lng -84.50 to -84.25

---

## 📊 Data Statistics

After seeding, you should have:
- **4 Markets:** Baltimore, Dallas, Phoenix, Atlanta
- **~20 Zones:** 3-5 per market
- **~20 Clients:** Banks and financial institutions
- **~13 Storage Lots:** Mix of lots and stashes
- **~11 Drivers:** Distributed across markets/zones
- **~21 Fleet Vehicles:** Tow trucks, spotters, rollbacks
- **~242 Located Vehicles:** Main operational data
- **~82 Spotter Submissions:** Vehicle discovery data

---

## 🔄 Re-running Seeding

The script is **idempotent** - you can run it multiple times safely:
- Uses `upsert` operations (updates if exists, inserts if not)
- Handles duplicates gracefully
- Won't create duplicate records

To completely replace data again:
```bash
npm run db:seed:complete
```

---

## 📝 Notes

- **User Profiles:** User profiles should be created through Supabase Auth, not CSV import
- **Relationships:** All foreign keys are automatically mapped (markets → zones, clients → vehicles, etc.)
- **Coordinates:** GPS coordinates are parsed from GPS or NOTES columns
- **Status Mapping:** Vehicle status is determined from TYPE and STATUS columns
- **Driver Assignment:** Drivers are linked by name matching

---

## ✅ Success Checklist

- [ ] CSV files copied to `public/data/`
- [ ] `.env` file configured with Supabase credentials
- [ ] Seeding script ran successfully
- [ ] All tables have data in Supabase Dashboard
- [ ] App shows new data (not old/mock data)
- [ ] Maps show vehicles in correct locations
- [ ] Filters work correctly
- [ ] No console errors

---

## 🚀 Next Steps

Once data is seeded:
1. Test all dashboard views
2. Verify filtering works
3. Check map views show correct locations
4. Test driver assignments
5. Verify client preferences work
6. Test spotter submissions flow

**Your application now uses the new CSV data exclusively!** 🎉

---

## 🆘 Need Help?

If you encounter issues:
1. Check Supabase Dashboard for errors
2. Review script output for warnings
3. Verify CSV file formats match expected structure
4. Check browser console for frontend errors
5. Review Supabase logs in Dashboard


