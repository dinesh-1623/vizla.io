# 🚀 Supabase Backend - Quick Start Guide

## Overview

Your Vizla Dashboard now supports Supabase as the backend database! The implementation includes:

- ✅ Complete database schema with 10 tables
- ✅ SQL migrations for easy deployment
- ✅ CSV seeding script for initial data
- ✅ Data source toggle (Mock ⇄ Supabase)
- ✅ Row Level Security (RLS) policies
- ✅ Dashboard aggregation views

## 🎯 Quick Setup (5 Minutes)

### Step 1: Get Supabase Credentials

Your Supabase project is already created:
- **Project URL**: `https://leufayhtfjxwhxwtsmyq.supabase.co`
- **Anon Key**: Use the value from your Supabase dashboard

Get your keys from: https://app.supabase.com/project/leufayhtfjxwhxwtsmyq/settings/api

### Step 2: Configure Environment

Create `.env` file in project root:
```bash
VITE_SUPABASE_URL=https://leufayhtfjxwhxwtsmyq.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key-here>
VITE_SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key-here>
```

### Step 3: Apply Database Schema

**Option A - Supabase Dashboard (Easiest)**:
1. Go to https://app.supabase.com/project/leufayhtfjxwhxwtsmyq/editor
2. Click "New Query"
3. Copy contents of `supabase/migrations/master.sql`
4. Paste and click "Run"
5. Wait for "Success" message

**Option B - Supabase CLI**:
```bash
supabase migration up
```

### Step 4: Seed Data

Run the seeding script to populate from CSV files:
```bash
npm run db:seed
```

Expected output:
```
🌱 Starting database seeding...
✅ Markets: 1 inserted, 0 skipped
✅ Zones: 12 inserted, 0 skipped
✅ Clients: 30 inserted, 0 skipped
✅ Storage Lots: 4 inserted, 0 skipped
✅ Vehicles: 150+ inserted
✅ Seeding complete!
```

### Step 5: Toggle to Supabase

**Method 1 - UI Toggle (Recommended)**:
1. Open the app in browser
2. Click the database icon (🗄️) in the header
3. Select "Supabase"
4. Page reloads with live data

**Method 2 - Browser Console**:
```javascript
localStorage.setItem('vizla-settings', JSON.stringify({
  state: { dataSource: 'supabase' },
  version: 0
}));
window.location.reload();
```

## ✅ Verify It Works

1. **Check KPIs**: Dashboard should show real counts from your database
2. **View Vehicles**: Vehicle list should display data from Supabase
3. **Test Filters**: Market/Status/Zone filters should work
4. **Compare Data**: Switch between Mock and Supabase to verify

## 📊 What's Included

### Database Tables
- `markets` - Operating regions
- `zones` - Geographic subdivisions  
- `clients` - Customer companies
- `storage_lots` - Storage locations
- `drivers` - Human operators
- `fleet_vehicles` - Company equipment
- `located_vehicles` - Customer vehicles to recover
- `assignments` - Driver-vehicle mappings
- `shifts` - Work periods
- `spotter_submissions` - Field sightings

### Views
- `dashboard_kpis` - High-level metrics
- `dashboard_by_client` - Client breakdown
- `dashboard_by_market` - Market breakdown
- `dashboard_matrix` - Detailed matrix
- `awaiting_tow_by_driver` - Driver assignments

### Helper Functions
- `haversine_km()` - Calculate distance
- `find_nearest_storage_lot()` - Route optimization
- `get_vehicles_filtered()` - Complex filtering

## 🔧 Troubleshooting

### "Supabase environment variables not configured"
- Check `.env` file exists
- Verify variable names start with `VITE_`
- Restart dev server after adding .env

### "Error loading vehicles from Supabase"
- Check RLS policies are applied
- Verify migrations completed successfully
- Check browser console for detailed errors

### "No data showing"
- Run `npm run db:seed` to populate database
- Check Supabase Dashboard → Table Editor
- Verify data source is set to 'supabase'

### Migration Errors
- Check PostgreSQL logs in Supabase Dashboard
- Ensure enums are created before tables
- Try dropping and re-creating tables if needed

## 🎨 UI Features

### Data Source Toggle
- **Icon**: Database icon in header (🗄️)
- **Location**: Next to theme toggle
- **Behavior**: Reloads page on switch

### Current Status Indicator
- **Mock Mode**: Gray database icon (🗄️)
- **Supabase Mode**: Colored database icon (🗄️)
- **Tooltip**: Shows current data source

## 📚 Documentation

Full documentation available:
- [Database Schema](docs/backend/erd.md)
- [Migration Plan](docs/backend/migration-plan.md)
- [RLS Policies](docs/backend/rls.md)
- [Implementation Summary](SUPABASE_IMPLEMENTATION_SUMMARY.md)

## 🚀 Next Steps

1. **Test all features** with Supabase data
2. **Add authentication** for real users
3. **Configure RLS** for production
4. **Set up real-time** subscriptions
5. **Deploy to production** on Netlify

## 💡 Tips

- Start with **Mock mode** during development
- Switch to **Supabase** for testing real queries
- Use **Supabase Dashboard** to inspect data
- Check **browser console** for query logs
- Monitor **Supabase logs** for errors

## 🎉 Success!

Your Vizla Dashboard now has a production-ready Supabase backend!

**Need help?** Check the troubleshooting section or review the documentation files.


