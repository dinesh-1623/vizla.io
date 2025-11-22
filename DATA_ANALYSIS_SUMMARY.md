# Application Data Analysis Summary

## Overview
This document summarizes the analysis of your Vehicle Recovery/Towing Management System and provides a comprehensive prompt for generating dummy data sets.

---

## Application Structure

### Core Business Model
Your application is a **Vehicle Recovery/Towing Management System** that:
- Manages vehicle repossession operations for banks and financial institutions
- Operates across multiple markets and zones
- Tracks located vehicles through their lifecycle (Located → Dispatched → Towed/Stashed/Blocked)
- Assigns drivers to recover vehicles
- Manages fleet vehicles (tow trucks, spotters, rollbacks)
- Handles spotter submissions for vehicle discovery
- Manages client preferences and contracts
- Tracks driver shifts and assignments
- Provides dashboards for operations management

---

## Database Schema Analysis

### 1. **Core Dimensions** (`003_dimensions.sql`)
- **Markets**: Geographic markets (Baltimore, Dallas, Phoenix, Atlanta)
- **Zones**: Sub-divisions within markets
- **Clients**: Banks, lenders, financial institutions with preferences
- **Storage Lots**: Physical locations for vehicle storage (lots and stashes)

### 2. **Vehicles** (`004_vehicles.sql`)
- **Fleet Vehicles**: Company-owned equipment (Tow Trucks, Spotters, Rollbacks)
- **Located Vehicles**: Customer vehicles that need recovery (main entity)

### 3. **Personnel** (`005_personnel.sql`)
- **Drivers**: Driver profiles with market/zone assignments, shift schedules
- **Shifts**: Historical and active driver shift records

### 4. **Assignments** (`006_assignments.sql`)
- **Assignments**: Links vehicles to drivers and shifts with route sequencing
- **Spotter Submissions**: Vehicle sightings submitted by spotters

### 5. **Authentication** (`002_auth_profiles.sql`)
- **Profiles**: User accounts with roles (admin, dispatcher, manager, driver, spotter)

---

## Key Data Entities & Relationships

### Entity Relationships Map:
```
Markets (1) ──→ (N) Zones
Markets (1) ──→ (N) Storage Lots
Markets (1) ──→ (N) Drivers
Markets (1) ──→ (N) Fleet Vehicles
Markets (1) ──→ (N) Located Vehicles

Clients (1) ──→ (N) Located Vehicles
Clients (1) ──→ (N) Spotter Submissions

Drivers (1) ──→ (N) Shifts
Drivers (1) ──→ (N) Assignments
Drivers (1) ──→ (N) Fleet Vehicles (assigned)
Drivers (1) ──→ (N) Located Vehicles (assigned)

Located Vehicles (1) ──→ (N) Assignments
Shifts (1) ──→ (N) Assignments
```

---

## Data Type Details

### Vehicle Status Flow:
```
Located → Dispatched → Towed/Stashed/Blocked
```

### Status Definitions:
- **Located**: Initial discovery, not yet assigned
- **Dispatched**: Driver assigned, en route
- **Towed**: Successfully recovered
- **Stashed**: Temporarily stored at stash location
- **Blocked**: Cannot access (legal/fence/other issues)

### Driver Status:
- **active**: Currently working
- **inactive**: Not available
- **on_break**: Temporarily unavailable
- **offline**: Not logged in

### User Roles:
- **admin**: Full system access
- **dispatcher**: Assign vehicles, view all operations
- **manager**: View dashboards, reports
- **driver**: View own assignments
- **spotter**: Submit vehicle sightings

---

## Frontend Data Requirements

### Dashboard Views:
1. **Main Dashboard**: Zone capacity, driver utilization, route optimization
2. **Dispatched View**: Manager view of all assigned vehicles by driver
3. **Located Dashboard**: All located vehicles with filtering
4. **Operations Map**: Geographic visualization of vehicles and drivers
5. **Fleet Management**: Company vehicle tracking
6. **Client Preferences**: Client-specific settings and pricing
7. **Spotter Submissions**: Vehicle discovery form and review
8. **Zone Capacity**: Capacity planning and shift management
9. **Scheduling**: Driver shift management

### Data Dependencies:
- All views require markets/zones/clients to be populated first
- Drivers need user profiles
- Vehicles need clients, markets, zones
- Assignments need vehicles, drivers, shifts
- Location data (lat/lng) needed for map views

---

## Current Data State

### Existing Data Sources:
1. **CSV Files**: Located vehicles from CSV imports (historical data)
2. **Mock Data**: Frontend mock data for testing
   - `dispatchedMock.ts`: Dispatched vehicle mock data
   - `mockCars.ts`: Vehicle mock data
   - `client-preferences.json`: Sample client preferences
3. **Database**: Supabase tables (currently empty or minimal)

### Data Gaps:
- No comprehensive seed data for all tables
- Missing relationships between entities
- No realistic geographic distribution
- No temporal consistency (workflow progression)
- Missing user accounts and authentication data

---

## Data Generation Strategy

### Approach:
Generate a **complete, interconnected dataset** that represents:
- A functioning company operating across 4 markets
- 2-4 weeks of operational history
- Realistic workflow progression (vehicles moving through statuses)
- Active operations (today's data) mixed with historical data
- All relationships properly linked (foreign keys)

### Benefits:
1. **Full System Testing**: Test all features with realistic data
2. **Demo Capability**: Show stakeholders a working system
3. **Development**: Frontend and backend development with real data patterns
4. **Performance Testing**: Test with realistic data volumes
5. **Training**: Use for user training and documentation

---

## Generated Prompt Document

The file `DATA_GENERATION_PROMPT.md` contains a comprehensive prompt that you can copy/paste into ChatGPT to generate all the SQL INSERT statements needed to populate your database.

### Prompt Features:
- ✅ Detailed specifications for each table
- ✅ Relationship requirements (foreign keys)
- ✅ Data consistency rules
- ✅ Volume requirements
- ✅ Geographic consistency (coordinates, addresses)
- ✅ Temporal consistency (workflow progression)
- ✅ Realistic business scenarios
- ✅ SQL INSERT format ready for Supabase

---

## Next Steps

1. **Copy the prompt** from `DATA_GENERATION_PROMPT.md`
2. **Paste into ChatGPT** (or similar AI tool)
3. **Generate SQL data** (will output INSERT statements)
4. **Review the generated data** for quality
5. **Run SQL in Supabase**:
   - Open Supabase Dashboard → SQL Editor
   - Paste generated SQL
   - Execute to populate database
6. **Verify data** through your application UI
7. **Adjust quantities** if needed (regenerate specific tables)

---

## Table Generation Order

When inserting data, follow this order to respect foreign key constraints:

1. **Markets** (no dependencies)
2. **Zones** (needs markets)
3. **Storage Lots** (needs markets)
4. **Clients** (no dependencies)
5. **User Profiles** (no dependencies, but may reference markets)
6. **Drivers** (needs profiles, markets, zones)
7. **Fleet Vehicles** (needs markets, zones, storage lots, drivers)
8. **Located Vehicles** (needs clients, markets, zones, drivers)
9. **Shifts** (needs drivers, markets)
10. **Assignments** (needs vehicles, drivers, shifts)
11. **Spotter Submissions** (needs clients, drivers, vehicles optional)

---

## Testing Checklist

After generating and inserting data, verify:

- [ ] Markets appear in dropdowns
- [ ] Zones filter correctly by market
- [ ] Drivers appear in assignment views
- [ ] Vehicles show correct status distribution
- [ ] Client preferences load correctly
- [ ] Map views show vehicles in correct locations
- [ ] Assignments link vehicles to drivers properly
- [ ] Shift data shows in scheduling views
- [ ] Spotter submissions appear in review queue
- [ ] Fleet vehicles show correct assignments
- [ ] Dashboard metrics calculate correctly
- [ ] All foreign key relationships are valid

---

## Notes

- The prompt generates data for "Premium Recovery Services" as a sample company
- All coordinates use realistic geographic data for each market
- VINs follow valid format (17 characters, excluding I, O, Q)
- License plates vary by state (MD, TX, AZ, GA)
- Timestamps create realistic workflow progression
- Mix of active and historical data for comprehensive testing

---

## Support

If you need to modify the data generation:
1. Edit the prompt to adjust volumes or requirements
2. Regenerate specific tables if needed
3. Use the same company name to maintain consistency
4. Update foreign key references if regenerating

For issues with the generated data:
- Check foreign key relationships
- Verify geographic coordinates are within market bounds
- Ensure temporal consistency (timestamps follow workflow)
- Validate status transitions are logical


