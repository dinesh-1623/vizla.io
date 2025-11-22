# Entity Relationship Diagram - Vizla Console

## Overview

This document defines the database schema for the Vizla Fleet Management Console. The schema supports vehicle recovery operations with spatial tracking, driver assignments, and multi-tenant (client/market/zone) organization.

## Core Entities & Relationships

```
┌─────────────────────────────────────────────────────────────────────┐
│                         VISLA ENTITIES                               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    MARKETS      │     │   STORAGE_LOTS  │     │    CLIENTS      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ code (UQ)       │────<│ market_id (FK)  │     │ code (UQ)       │
│ name            │1   *│ name            │     │ name            │
│ is_active       │     │ type            │     │ contact_email   │
│ created_at      │     │ lat, lng        │     │ contact_phone   │
└─────────────────┘     │ address         │     │ is_active       │
       │                │ created_at      │     │ created_at      │
       │ 1              └─────────────────┘     └─────────────────┘
       │                                           │
       │ *                                         │ 1
       └───────────────────────────────────────┐  │
                                               │  │
                              ┌────────────────▼──▼──▼────────────────┐
                              │              ZONES                     │
                              ├───────────────────────────────────────┤
                              │ id (PK)                                │
                              │ market_id (FK)                         │
                              │ code (UQ)                              │
                              │ name                                   │
                              │ is_active                              │
                              │ created_at                             │
                              └─────────────┬──────────────────────────┘
                                            │
                                            │ 1
                                            │
                                            │ *
┌─────────────────┐     ┌──────────────────▼──────────────────┐
│   FLEET_VEHICLES│     │         LOCATED_VEHICLES             │
├─────────────────┤     ├──────────────────────────────────────┤
│ id (PK)         │     │ id (PK)                              │
│ vin (UQ)        │     │ vin (UQ)                             │
│ make            │     │ client_id (FK)                       │
│ model           │     │ zone_id (FK)                         │
│ year            │     │ market_id (FK)                       │
│ type            │     │ plate                                │
│ driver_id (FK)  │     │ year, make, model, color             │
│ status          │     │ address, lat, lng                    │
│ zone_id (FK)    │     │ status                               │
│ market_id (FK)  │     │ source                               │
│ created_at      │     │ assigned_driver_id (FK)              │
└─────────────────┘     │ located_at                           │
       │                │ dispatched_at                         │
       │ *              │ towed_at                              │
       │                │ stashed_at                            │
       └────────────────┤ photos (TEXT[])                       │
                        │ notes (TEXT[])                        │
                        │ created_at, updated_at                │
                        └───────────────────────┬───────────────┘
                                                │
                                                │ *
                        ┌───────────────────────▼──────────────────┐
                        │              ASSIGNMENTS                 │
                        ├──────────────────────────────────────────┤
                        │ id (PK)                                  │
                        │ vehicle_id (FK)                          │
                        │ driver_id (FK)                           │
                        │ shift_id (FK)                            │
                        │ sequence_order                           │
                        │ assigned_at                              │
                        │ estimated_pickup, actual_pickup          │
                        │ estimated_dropoff, actual_dropoff        │
                        │ status                                   │
                        └───────────────────────┬──────────────────┘
                                                │
                                                │ 1
                                                │
                                                │ *
┌─────────────────┐     ┌───────────────────────▼──────────────────┐
│     SHIFTS      │     │            DRIVERS                        │
├─────────────────┤     ├──────────────────────────────────────────┤
│ id (PK)         │     │ id (PK)                                  │
│ driver_id (FK)  │────<│ user_id (FK) → auth.users                │
│ market_id (FK)  │1   *│ name                                     │
│ shift_date      │     │ email                                    │
│ shift_type      │     │ phone                                    │
│ shift_start     │     │ market_id (FK)                           │
│ shift_end       │     │ zone_id (FK)                             │
│ goal_count      │     │ shift_type                               │
│ completed_count │     │ shift_start, shift_end                   │
│ hours_worked    │     │ max_capacity                             │
│ status          │     │ status                                   │
│ created_at      │     │ location_lat, location_lng               │
└─────────────────┘     │ location_updated_at                      │
                        │ created_at, updated_at                   │
                        └──────────────────────────────────────────┘
                                  │
                                  │ *
                                  │
                        ┌─────────▼──────────────────┐
                        │   SPOTTER_SUBMISSIONS      │
                        ├────────────────────────────┤
                        │ id (PK)                    │
                        │ vehicle_id (FK)            │
                        │ spotter_id (FK)            │
                        │ client_id (FK)             │
                        │ vin, year, make, model     │
                        │ color, plate, address      │
                        │ reachable, rusted          │
                        │ location_type              │
                        │ parked_type                │
                        │ notes (TEXT[])             │
                        │ photo_urls (TEXT[])        │
                        │ status                     │
                        │ created_at                 │
                        └────────────────────────────┘
```

## Entity Descriptions

### 1. **markets**
Root organizational unit. Each market represents a geographic operating region.

- **Purpose**: Multi-tenant data isolation and regional operations
- **Cardinality**: 1-to-many with zones, storage_lots, drivers
- **Key fields**:
  - `code`: Unique market identifier (e.g., "BALT", "DAL")
  - `name`: Display name (e.g., "Baltimore", "Dallas")
  - `is_active`: Soft delete flag

### 2. **zones**
Geographic subdivisions within a market. Used for driver assignment and capacity planning.

- **Purpose**: Driver territory management and capacity tracking
- **Cardinality**: Many-to-one with market; 1-to-many with vehicles, drivers
- **Key fields**:
  - `market_id`: Parent market
  - `code`: Zone code within market (e.g., "BALTCO", "EAST")
  - `name`: Display name

### 3. **storage_lots**
Physical locations where vehicles are stored. Includes both permanent lots and temporary stash spots.

- **Purpose**: Route optimization origin points and inventory management
- **Cardinality**: Many-to-one with market
- **Key fields**:
  - `type`: 'lot' (permanent) or 'stash' (temporary)
  - `lat, lng`: Precise coordinates for distance calculations
  - `address`: Human-readable location

### 4. **clients**
Customers who contract for vehicle recovery services.

- **Purpose**: Revenue attribution and client-specific workflows
- **Cardinality**: 1-to-many with located_vehicles, spotter_submissions
- **Key fields**:
  - `code`: Short identifier (e.g., "FWB", "CAP")
  - `name`: Full company name
  - `contact_email, contact_phone`: Support contacts

### 5. **drivers**
Human operators who perform vehicle recovery. Linked to Supabase Auth user.

- **Purpose**: Identity, shift tracking, and capacity management
- **Cardinality**: Many-to-one with market, zone; 1-to-many with shifts, assignments
- **Key fields**:
  - `user_id`: Supabase Auth foreign key
  - `market_id, zone_id`: Operational territory
  - `shift_type`: 'Day' or 'Night'
  - `shift_start, shift_end`: Shift hours
  - `max_capacity`: Maximum vehicles per shift
  - `status`: 'active', 'inactive', 'on_break', 'offline'
  - `location_lat, location_lng`: Real-time GPS tracking

### 6. **fleet_vehicles**
Company-owned tow trucks, spotter cars, and rollbacks.

- **Purpose**: Equipment inventory and maintenance tracking
- **Cardinality**: Many-to-one with market, zone
- **Key fields**:
  - `vin`: Vehicle identification number (unique)
  - `type`: 'Tow Truck', 'Spotter', 'Rollback'
  - `status`: 'Active', 'Inactive', 'Maintenance'
  - `driver_id`: Current operator

### 7. **located_vehicles**
Customer vehicles that need to be recovered. This is the central data entity.

- **Purpose**: Recovery queue management and status tracking
- **Cardinality**: Many-to-one with client, zone, market; 1-to-many with assignments
- **Key fields**:
  - `vin`: Customer vehicle VIN (unique)
  - `plate`: License plate
  - `year, make, model, color`: Vehicle identification
  - `address, lat, lng`: Recovery location
  - `status`: 'Located' | 'Blocked' | 'Stashed' | 'Dispatched' | 'Towed'
  - `source`: Detection method ('GPS', 'Rotors', 'Imp', 'Fuel', etc.)
  - `assigned_driver_id`: Current recovery driver
  - `located_at, dispatched_at, towed_at, stashed_at`: Status timestamps
  - `photos`: Array of photo URLs from spotter submissions
  - `notes`: Free-text notes array

### 8. **assignments**
Driver-to-vehicle mappings for a specific shift. Supports route ordering.

- **Purpose**: Work queue tracking and completion metrics
- **Cardinality**: Many-to-one with vehicle, driver, shift
- **Key fields**:
  - `vehicle_id, driver_id, shift_id`: Three-way relationship
  - `sequence_order`: Route position
  - `assigned_at`: When assignment was created
  - `estimated_pickup, actual_pickup`: Pickup scheduling
  - `estimated_dropoff, actual_dropoff`: Delivery scheduling
  - `status`: 'assigned', 'in-progress', 'completed', 'cancelled'

### 9. **shifts**
Historical and current work periods for drivers. Tracks performance.

- **Purpose**: Shift metrics and capacity analysis
- **Cardinality**: Many-to-one with driver, market
- **Key fields**:
  - `shift_date, shift_type`: Time dimension
  - `shift_start, shift_end`: Actual times
  - `goal_count`: Target recoveries
  - `completed_count`: Actual recoveries
  - `hours_worked`: Time tracking
  - `status`: 'active', 'completed', 'cancelled'

### 10. **spotter_submissions**
Photo-based vehicle sightings from field spotters.

- **Purpose**: Initial vehicle location intelligence
- **Cardinality**: Many-to-one with vehicle, spotter, client
- **Key fields**:
  - All vehicle details (vin, year, make, model, color, plate)
  - Condition flags: `reachable`, `rusted`
  - Location metadata: `location_type`, `parked_type`
  - `photo_urls`: Array of Supabase Storage URLs
  - `notes`: Condition notes array
  - `status`: 'pending', 'verified', 'duplicate', 'rejected'

## Enums

```sql
CREATE TYPE vehicle_status AS ENUM (
  'Located',      -- Initial discovery
  'Blocked',      -- Cannot access (fence, legal, etc.)
  'Stashed',      -- Temporary stash spot
  'Dispatched',   -- Driver en route
  'Towed'         -- Completed recovery
);

CREATE TYPE spotter_submission_status AS ENUM (
  'pending',      -- Awaiting review
  'verified',     -- Confirmed as valid
  'duplicate',    -- Already exists
  'rejected'      -- Invalid submission
);

CREATE TYPE shift_type AS ENUM ('Day', 'Night');
CREATE TYPE storage_lot_type AS ENUM ('lot', 'stash');
CREATE TYPE driver_status AS ENUM ('active', 'inactive', 'on_break', 'offline');
CREATE TYPE assignment_status AS ENUM ('assigned', 'in-progress', 'completed', 'cancelled');
```

## Key Relationships

1. **markets → zones → located_vehicles**: Geographic hierarchy
2. **drivers → shifts → assignments → located_vehicles**: Work queue
3. **clients → located_vehicles → assignments**: Client billing
4. **spotter_submissions → located_vehicles**: Discovery pipeline
5. **storage_lots**: Route optimization origins (used in Haversine calculations)

## Design Decisions

### Why separate `located_vehicles` from `fleet_vehicles`?
- Different lifecycles: fleet vehicles are persistent assets; located vehicles are transient recovery tasks
- Different ownership: fleet = company assets; located = customer vehicles
- Different tracking: fleet = maintenance/availability; located = recovery status

### Why three-way relationship in `assignments`?
- Enables historical analysis: "Which vehicles did Driver X work in Shift Y?"
- Supports route optimization: `sequence_order` within a shift
- Time-bounded work: assignments tied to shift dates

### Why soft deletes (`is_active` flags)?
- Audit trail preservation
- Historical reporting
- Regulatory compliance

### Why arrays for `notes` and `photos`?
- PostgreSQL native support
- Simple append-only audit logs
- Efficient queries with `@>` and `&&` operators

## Indexes

```sql
-- Foreign keys
CREATE INDEX idx_located_vehicles_client_id ON located_vehicles(client_id);
CREATE INDEX idx_located_vehicles_zone_id ON located_vehicles(zone_id);
CREATE INDEX idx_located_vehicles_market_id ON located_vehicles(market_id);
CREATE INDEX idx_located_vehicles_assigned_driver_id ON located_vehicles(assigned_driver_id);

-- Status queries (most common)
CREATE INDEX idx_located_vehicles_status ON located_vehicles(status);
CREATE INDEX idx_located_vehicles_status_zone ON located_vehicles(status, zone_id);

-- Time-based queries
CREATE INDEX idx_located_vehicles_located_at ON located_vehicles(located_at);
CREATE INDEX idx_shifts_shift_date ON shifts(shift_date);

-- Spatial queries
CREATE INDEX idx_located_vehicles_location ON located_vehicles USING GIST (point(lng, lat));
CREATE INDEX idx_storage_lots_location ON storage_lots USING GIST (point(lng, lat));

-- Unique constraints
CREATE UNIQUE INDEX idx_located_vehicles_vin ON located_vehicles(vin) WHERE vin IS NOT NULL;
CREATE UNIQUE INDEX idx_markets_code ON markets(code);
CREATE UNIQUE INDEX idx_zones_market_code ON zones(market_id, code);
```

## Views for Dashboard Aggregations

```sql
-- View: Dashboard KPIs (Located, Bank GPS, etc.)
CREATE VIEW dashboard_kpis AS
SELECT
  COUNT(*) FILTER (WHERE status = 'Located') as located_count,
  COUNT(*) FILTER (WHERE status = 'Blocked') as blocked_count,
  COUNT(*) FILTER (WHERE status = 'Stashed') as stashed_count,
  COUNT(*) FILTER (WHERE status = 'Dispatched') as dispatched_count,
  COUNT(*) FILTER (WHERE source = 'BANK GPS') as bank_gps_count,
  AVG(EXTRACT(EPOCH FROM (NOW() - located_at))/86400) FILTER (WHERE status IN ('Located', 'Blocked', 'Stashed')) as avg_age_days
FROM located_vehicles
WHERE market_id = :market_id;

-- View: By Client breakdown
CREATE VIEW dashboard_by_client AS
SELECT
  c.id as client_id,
  c.name as client_name,
  COUNT(*) as total_vehicles,
  COUNT(*) FILTER (WHERE lv.status = 'Located') as located_count,
  COUNT(*) FILTER (WHERE lv.status = 'Blocked') as blocked_count,
  COUNT(*) FILTER (WHERE lv.status = 'Stashed') as stashed_count
FROM clients c
LEFT JOIN located_vehicles lv ON lv.client_id = c.id
GROUP BY c.id, c.name;

-- View: Detailed breakdown (Client × Zone × Driver)
CREATE VIEW dashboard_matrix AS
SELECT
  c.name as client,
  z.name as zone,
  d.name as driver,
  COUNT(*) as vehicle_count
FROM located_vehicles lv
JOIN clients c ON c.id = lv.client_id
JOIN zones z ON z.id = lv.zone_id
LEFT JOIN drivers d ON d.id = lv.assigned_driver_id
WHERE lv.status IN ('Located', 'Blocked', 'Stashed')
GROUP BY c.name, z.name, d.name;
```

## Future Extensions

- `tow_events`: Detailed completion records (photos, signature, damages)
- `payments`: Client billing and driver payments
- `maintenance_logs`: Fleet vehicle service history
- `client_preferences`: Custom workflow rules per client


