# Migration Plan - Vizla Console Backend

## Overview

This document outlines the step-by-step migration from mock CSV data to Supabase PostgreSQL with authentication, real-time subscriptions, and serverless functions.

## Migration Order

### Phase 1: Foundation
1. **Auth & Users** (`000_auth.sql`)
   - Set up Supabase Auth
   - Create `profiles` table linked to `auth.users`
   - Define roles enum
   - RLS policies for profile access

2. **Core Dimensions** (`001_dimensions.sql`)
   - `markets` table
   - `zones` table
   - `clients` table
   - `storage_lots` table
   - Enums for statuses
   - Indexes on codes

3. **Vehicles & Fleet** (`002_vehicles.sql`)
   - `fleet_vehicles` table (tow trucks, spotters)
   - `located_vehicles` table (customer vehicles)
   - Foreign keys to dimensions
   - Spatial indexes (PostGIS extension)

### Phase 2: Operations
4. **Personnel** (`003_personnel.sql`)
   - `drivers` table (linked to profiles)
   - `shifts` table
   - Foreign keys and indexes

5. **Assignments** (`004_assignments.sql`)
   - `assignments` table (driver-vehicle-shift mapping)
   - `spotter_submissions` table
   - Trigger functions for audit logs

### Phase 3: Views & RPCs
6. **Analytics** (`005_views.sql`)
   - Dashboard views (KPI aggregates)
   - Client breakdown views
   - Driver performance views
   - Matrix views (Client×Zone×Driver)

7. **Functions** (`006_functions.sql`)
   - `calculate_distance()`: Haversine distance
   - `find_nearest_storage_lot()`: Route optimization helper
   - `get_shift_capacity()`: Capacity analysis
   - `update_driver_location()`: GPS update RPC

### Phase 4: RLS & Security
8. **Row Level Security** (`007_rls.sql`)
   - Enable RLS on all tables
   - Admin policies (full access)
   - Dispatcher policies (read all, write within market)
   - Driver policies (own data only)
   - Spotter policies (own submissions)

### Phase 5: Storage
9. **Storage Buckets** (`008_storage.sql`)
   - `vehicle-images` bucket (public read)
   - RLS policies for uploads
   - Folder structure: `/market/zone/date/`

## Seed Strategy

### 1. CSV Parser (`scripts/seed-from-csv.ts`)

Input files from `public/data/`:
- `markets-zones.csv` → `markets`, `zones` tables
- `clients.json` → `clients` table
- `storage-lots.json` → `storage_lots` table
- `located-vehicles.csv` → `located_vehicles` table
- `vizla-dashboard.csv` → Aggregate reference data
- `spotter_submissions.json` → `spotter_submissions` table

### 2. Seeding Steps

```typescript
// Order of operations
1. Parse CSV files
2. Upsert markets (idempotent)
3. Upsert zones (link to markets)
4. Upsert clients (from JSON)
5. Upsert storage_lots (from JSON)
6. Insert located_vehicles (bulk insert)
7. Insert spotter_submissions (from JSON)
8. Create admin user (seed)
9. Create sample drivers (from mock data)
10. Create current shifts
11. Create sample assignments
```

### 3. Data Mapping

#### `located-vehicles.csv` → `located_vehicles`:
- `VIN` → `vin` (unique constraint)
- `TAG` → `plate`
- `YEAR, MAKE, MODEL, COLOR` → vehicle details
- `STREET, CITY, ZIP` → `address` (concatenate)
- `NOTES` field → parse lat/lng with regex
- `CLIENT` → look up `client_id`
- `DRIVER` → map to `source` field
- `TYPE` → determine initial `status`
- Default `status` = 'Located' if empty

#### `vizla-dashboard.csv` → Validation reference:
- Used to cross-check client/zone/driver counts
- Not a data source itself

## Auth & Roles Model

### Roles

```sql
CREATE TYPE user_role AS ENUM (
  'admin',      -- Full access to all data
  'dispatcher', -- Assign vehicles, view all data
  'manager',    -- View dashboards, reports
  'driver',     -- View own assignments, update status
  'spotter'     -- Submit vehicle sightings
);
```

### Profile Structure

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'driver',
  market_id UUID REFERENCES markets(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Default Seed Users

1. **Admin**: `admin@vizla.com` (role: admin)
2. **Dispatcher**: `dispatch@vizla.com` (role: dispatcher)
3. **Sample Drivers**: 5-10 drivers from mock data

## Storage Strategy

### Supabase Storage Buckets

1. **`vehicle-images`** (public):
   - Path: `{market}/{zone}/{vehicle_id}/{timestamp}.jpg`
   - Max file size: 5MB
   - Allowed MIME: `image/jpeg`, `image/png`, `image/webp`
   - Public read access
   - Upload requires auth

2. **`documents`** (private):
   - Client documents, contracts
   - Requires signed URLs for access

### Example Upload Flow

```typescript
// Frontend
const file = event.target.files[0];
const path = `${market}/${zone}/${vehicleId}/${Date.now()}.jpg`;

const { data, error } = await supabase.storage
  .from('vehicle-images')
  .upload(path, file);

const { data: { publicUrl } } = supabase.storage
  .from('vehicle-images')
  .getPublicUrl(path);

// Store publicUrl in vehicle.photos array
```

## RLS Policy Outline

See `docs/backend/rls.md` for detailed policies. Summary:

### Admin
- **SELECT, INSERT, UPDATE, DELETE**: All tables, all rows

### Dispatcher
- **SELECT**: All tables, all rows
- **INSERT, UPDATE**: `assignments`, `located_vehicles`, `shifts` (within assigned markets)
- **DELETE**: None

### Manager
- **SELECT**: All tables, all rows
- **INSERT, UPDATE, DELETE**: None

### Driver
- **SELECT**: Own data only (`drivers.id = auth.uid()`)
- **UPDATE**: Own driver record (location), own assignments
- **INSERT, DELETE**: None

### Spotter
- **INSERT, UPDATE**: Own `spotter_submissions`
- **SELECT**: Own submissions + vehicles assigned to spottings
- **DELETE**: None

## API Surface

### REST API (Next.js Route Handlers)

All endpoints use Supabase server client with service role key.

#### Dashboard Endpoints

- **`GET /api/dashboard/kpis`**
  - Query params: `market`, `status`, `zone`, `from`, `to`
  - Returns: Count aggregations (located, blocked, stashed, dispatched, bank GPS, avg time)
  - Uses: `dashboard_kpis` view

- **`GET /api/dashboard/by-client`**
  - Query params: `market`
  - Returns: `{client_id, client_name, total_vehicles, located_count, blocked_count, stashed_count}[]`
  - Uses: `dashboard_by_client` view

- **`GET /api/dashboard/by-market`**
  - Query params: none
  - Returns: Market-level aggregations

- **`GET /api/dashboard/awaiting-by-driver`**
  - Query params: `market`, `shift_type`
  - Returns: `{driver_id, driver_name, awaiting_count}[]`

#### Drilldown Endpoints

- **`GET /api/drilldown/matrix`**
  - Query params: `market`, `client`, `zone`, `driver`
  - Returns: `{client, zone, driver, vehicle_count}[]`
  - Uses: `dashboard_matrix` view

#### Vehicle Endpoints

- **`GET /api/vehicles`**
  - Query params: `client`, `zone`, `driver`, `status`, `limit`, `offset`
  - Returns: `LocatedVehicle[]` (paginated)

- **`GET /api/vehicles/:id`**
  - Returns: Single vehicle with full details

- **`PATCH /api/vehicles/:id`**
  - Body: Partial update
  - Auth: Dispatcher+ only
  - Updates `status`, `assigned_driver_id`, timestamps

#### Reference Endpoints

- **`GET /api/storage-lots`**
  - Query params: `market`, `type`
  - Returns: Storage lots with lat/lng

- **`GET /api/markets`**
  - Returns: All active markets

- **`GET /api/zones`**
  - Query params: `market`
  - Returns: Zones within market

### Supabase Edge Functions (Optional - Phase 8)

- **`optimize-route`**: AI-powered route optimization (OpenAI integration)
- **`time-matrix`**: Calculate ETAs for vehicle list
- **`analyze-photo`**: Extract vehicle condition from spotter photos (OpenAI Vision)

## Frontend Integration

### Data Source Toggle

```typescript
// src/lib/settings.ts
export const dataSource = {
  current: localStorage.getItem('vizla.dataSource') || 'mock',
  set(source: 'mock' | 'supabase') {
    localStorage.setItem('vizla.dataSource', source);
    this.current = source;
  }
};
```

### Loader Abstraction

```typescript
// src/lib/data/loader-factory.ts
export async function loadLocated(filters: FilterParams): Promise<LocatedRow[]> {
  if (dataSource.current === 'mock') {
    return loadLocatedMock(filters); // Existing CSV loader
  } else {
    const response = await fetch(`/api/vehicles?${queryString(filters)}`);
    return response.json();
  }
}
```

### Component Updates

**Minimal changes required**:
- Replace `loadLocated()` calls with `loadLocated()` from factory
- Add toggle in settings page (optional UI)
- Keep existing prop interfaces unchanged

## Acceptance Criteria

- [ ] All migrations run without errors
- [ ] RLS policies prevent unauthorized access
- [ ] CSV seed script completes successfully
- [ ] API endpoints return correct data shapes
- [ ] Dashboard renders identically (Mock vs Supabase)
- [ ] TypeScript passes with generated types
- [ ] No console warnings
- [ ] Zero breaking changes to existing UI

## Migration Checklist

### Pre-Migration
- [ ] Create Supabase project
- [ ] Generate service role key
- [ ] Add environment variables
- [ ] Install dependencies (`@supabase/supabase-js`)

### Database Setup
- [ ] Run migrations 1-9 in order
- [ ] Verify tables created
- [ ] Verify indexes created
- [ ] Verify RLS enabled

### Data Migration
- [ ] Run seed script
- [ ] Verify record counts match CSVs
- [ ] Test foreign key constraints
- [ ] Verify enum values

### API Integration
- [ ] Create route handlers
- [ ] Test with Postman/curl
- [ ] Verify RLS policies with different users
- [ ] Add error handling

### Frontend Integration
- [ ] Add data source toggle
- [ ] Update loaders
- [ ] Test all pages with Supabase data
- [ ] Compare Mock vs Supabase output

### Validation
- [ ] All pages load correctly
- [ ] No console errors
- [ ] TypeScript compiles
- [ ] No performance regression
- [ ] RLS tested for each role

## Rollback Plan

If issues arise:

1. Set `dataSource.current = 'mock'` in localStorage
2. Frontend immediately reverts to CSV data
3. Database remains intact for debugging
4. Fix issues in Supabase/API
5. Re-enable Supabase data source

## Timeline

- **Setup & Migrations**: 2-3 hours
- **Seed Script**: 1-2 hours
- **API Endpoints**: 2-3 hours
- **Frontend Integration**: 1 hour
- **Testing & Validation**: 1-2 hours

**Total**: 7-11 hours

## Next Steps After Migration

1. **Real-time subscriptions**: Subscribe to vehicle status changes
2. **Driver GPS tracking**: Update driver location every 30s
3. **Push notifications**: Notify drivers of new assignments
4. **Edge functions**: Implement AI features
5. **Analytics**: Build historical dashboards
6. **Mobile app**: Use same Supabase backend


