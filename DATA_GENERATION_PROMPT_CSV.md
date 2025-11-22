# ChatGPT Prompt for Generating CSV Data Files

Use this prompt with ChatGPT to generate CSV files that can be uploaded to `public/data` folder for backend import.

---

## PROMPT FOR CHATGPT:

I need you to generate comprehensive CSV data files for a Vehicle Recovery/Towing Management System. Generate realistic CSV files that will be imported into a Supabase database via a seeding script. The files should represent "Premium Recovery Services" operating across 4 markets.

### COMPANY CONTEXT:
- **Company Name**: Premium Recovery Services
- **Operations**: Vehicle repossession/towing services for banks and financial institutions
- **Markets**: Baltimore, Dallas, Phoenix, Atlanta
- **Business Model**: Receives vehicle location data, dispatches drivers to recover vehicles

---

## CSV FILES TO GENERATE:

Generate the following CSV files in clean, standard CSV format (RFC4180 compliant, with header rows):

---

### 1. **markets-zones.csv**
Format: `market,zone,code,is_active`

**Columns:**
- **market**: Market name (Baltimore, Dallas, Phoenix, Atlanta)
- **zone**: Zone name within market (e.g., "Downtown", "North", "South", "East", "West")
- **code**: Zone code (e.g., "BAL-DT", "BAL-N", "DAL-C", "PHX-M", "ATL-DT")
- **is_active**: true/false (mostly true)

**Requirements:**
- 4 markets total
- 3-5 zones per market (12-20 zones total)
- Unique zone codes per market

**Example:**
```csv
market,zone,code,is_active
Baltimore,Downtown,BAL-DT,true
Baltimore,North,BAL-N,true
Baltimore,South,BAL-S,true
Baltimore,East,BAL-E,true
Baltimore,West,BAL-W,true
Dallas,Central,DAL-C,true
Dallas,North,DAL-N,true
Dallas,South,DAL-S,true
Dallas,West,DAL-W,true
Dallas,East,DAL-E,true
Phoenix,Metro,PHX-M,true
Phoenix,North Valley,PHX-NV,true
Phoenix,South Valley,PHX-SV,true
Phoenix,East Mesa,PHX-EM,true
Phoenix,West Glendale,PHX-WG,true
Atlanta,Downtown,ATL-DT,true
Atlanta,North Perimeter,ATL-NP,true
Atlanta,South,ATL-S,true
Atlanta,Buckhead,ATL-B,true
Atlanta,Eastside,ATL-E,true
```

---

### 2. **clients.csv**
Format: `id,name,code,contact_email,contact_phone,address,priority,repo_fee_usd,flatbed_preapproved,keys_required,notes,is_active`

**Columns:**
- **id**: Simple ID (client-001, client-002, etc.)
- **name**: Client name (e.g., "Capital One", "Wells Fargo")
- **code**: Short code (CAP1, WF, CHASE, BOA)
- **contact_email**: Email address
- **contact_phone**: Phone number
- **address**: Company address
- **priority**: High, Medium, or Low
- **repo_fee_usd**: Number (110-150)
- **flatbed_preapproved**: true/false
- **keys_required**: Required, Preferred, or Not Required
- **notes**: Optional notes text
- **is_active**: true/false (mostly true)

**Requirements:**
- 15-25 clients total
- Mix of major banks and financial institutions
- 30% High priority ($135-150), 50% Medium ($120-135), 20% Low ($110-120)

**Example:**
```csv
id,name,code,contact_email,contact_phone,address,priority,repo_fee_usd,flatbed_preapproved,keys_required,notes,is_active
client-001,Capital One,CAP1,repo@capitalone.com,(800) 555-0101,100 Main St Baltimore MD 21201,High,150,true,Required,VIP client,true
client-002,Wells Fargo,WF,auto@wellsfargo.com,(800) 555-0102,200 Market St Baltimore MD 21202,High,145,true,Required,Expedited processing,true
client-003,Chase Bank,CHASE,finance@chase.com,(800) 555-0103,300 Pratt St Baltimore MD 21202,High,140,true,Preferred,Standard processing,true
```

---

### 3. **storage-lots.csv**
Format: `name,type,address,lat,lng,market,is_active`

**Columns:**
- **name**: Lot name (e.g., "Main Storage Lot", "North Stash", "East Lot")
- **type**: lot or stash
- **address**: Full street address
- **lat**: Latitude (decimal, e.g., 39.2904)
- **lng**: Longitude (decimal, e.g., -76.6122)
- **market**: Market name (matches markets-zones.csv)
- **is_active**: true/false

**Requirements:**
- 2-4 lots per market (8-16 total)
- Mix of "lot" and "stash" types
- Realistic coordinates within each market area

**Coordinate Ranges by Market:**
- Baltimore: Lat 39.18 - 39.37, Lng -76.71 to -76.50
- Dallas: Lat 32.68 - 32.95, Lng -96.98 to -96.65
- Phoenix: Lat 33.30 - 33.65, Lng -112.20 to -111.85
- Atlanta: Lat 33.65 - 33.90, Lng -84.50 to -84.25

**Example:**
```csv
name,type,address,lat,lng,market,is_active
Main Storage Lot,lot,1200 Industrial Blvd Baltimore MD 21224,39.2904,-76.6122,Baltimore,true
North Stash,stash,4500 Northern Parkway Baltimore MD 21214,39.3456,-76.5678,Baltimore,true
East Lot,lot,5800 Eastern Ave Baltimore MD 21224,39.3123,-76.5456,Baltimore,true
Central Storage,lot,1500 Commerce St Dallas TX 75201,32.7767,-96.7970,Dallas,true
```

---

### 4. **drivers.csv**
Format: `id,name,email,phone,market,zone,shift_type,shift_start,shift_end,shift_goal,max_capacity,status,location_lat,location_lng`

**Columns:**
- **id**: Simple ID (drv-001, drv-002, etc.)
- **name**: Full name (e.g., "John Smith")
- **email**: Email address
- **phone**: Phone number
- **market**: Market name
- **zone**: Zone name (must match markets-zones.csv)
- **shift_type**: Day or Night
- **shift_start**: Time (08:00 or 20:00)
- **shift_end**: Time (20:00 or 08:00)
- **shift_goal**: Number (15-25)
- **max_capacity**: Number (8-12)
- **status**: active, inactive, on_break, or offline
- **location_lat**: Current latitude (within market)
- **location_lng**: Current longitude (within market)

**Requirements:**
- 8-12 drivers total
- Mix of Day and Night shifts
- Distribute across all markets and zones
- Most should be "active"
- Location coordinates within their market area

**Example:**
```csv
id,name,email,phone,market,zone,shift_type,shift_start,shift_end,shift_goal,max_capacity,status,location_lat,location_lng
drv-001,John Smith,john.smith@premiumrecovery.com,(410) 555-1001,Baltimore,Downtown,Day,08:00,20:00,20,10,active,39.2904,-76.6122
drv-002,Maria Garcia,maria.garcia@premiumrecovery.com,(410) 555-1002,Baltimore,North,Day,08:00,20:00,18,10,active,39.3456,-76.5678
drv-003,David Lee,david.lee@premiumrecovery.com,(410) 555-1003,Baltimore,East,Night,20:00,08:00,15,8,active,39.3123,-76.5456
drv-004,Sarah Johnson,sarah.johnson@premiumrecovery.com,(214) 555-1004,Dallas,Central,Day,07:00,19:00,22,12,active,32.7767,-96.7970
```

---

### 5. **fleet-vehicles.csv**
Format: `id,vin,make,model,year,type,driver_name,status,maintenance_status,starting_point,location,storage_lot,zone,market,shift,shift_goal_current,shift_goal_total`

**Columns:**
- **id**: Simple ID (fleet-001, fleet-002, etc.)
- **vin**: 17-character VIN
- **make**: Make (Ford, Ram, Chevrolet, International)
- **model**: Model (F-550, F-450, 3500, etc.)
- **year**: Year (2018-2024)
- **type**: Tow Truck, Spotter, or Rollback
- **driver_name**: Driver name (matches drivers.csv) or empty
- **status**: Active, Inactive, or Maintenance
- **maintenance_status**: Text or empty
- **starting_point**: Fixed or Not Fixed
- **location**: Text description
- **storage_lot**: Storage lot name (matches storage-lots.csv)
- **zone**: Zone name
- **market**: Market name
- **shift**: Day, Night, or empty
- **shift_goal_current**: Number (0-20)
- **shift_goal_total**: Number (15-25)

**Requirements:**
- 15-25 fleet vehicles total
- 60% Tow Trucks, 25% Spotters, 15% Rollbacks
- Most Active, 2-3 Maintenance, 1-2 Inactive
- Some assigned to drivers, some unassigned

**Example:**
```csv
id,vin,make,model,year,type,driver_name,status,maintenance_status,starting_point,location,storage_lot,zone,market,shift,shift_goal_current,shift_goal_total
fleet-001,1FTFW1E55MFA12345,Ford,F-550,2021,Tow Truck,John Smith,Active,,Fixed,Main Lot,Main Storage Lot,Downtown,Baltimore,Day,8,20
fleet-002,1FTFW1E56MFA12346,Ford,F-550,2022,Tow Truck,Maria Garcia,Active,,Fixed,North Stash,North Stash,North,Baltimore,Day,12,18
fleet-003,1FTFW1E57MFA12347,Ram,3500,2020,Tow Truck,,Active,,Not Fixed,Main Lot,Main Storage Lot,Central,Dallas,Day,0,22
fleet-004,1FTFW1E58MFA12348,Chevrolet,Silverado 3500,2019,Spotter,David Lee,Active,,Fixed,East Lot,East Lot,East,Baltimore,Night,5,15
```

---

### 6. **located-vehicles.csv** (MAIN DATA FILE)
Format: `TYPE,CLIENT,YEAR,MAKE,MODEL,COLOR,TAG,VIN,STREET,CITY,ZIP,GPS,SPOTTER,DRIVER,NOTES,STATUS`

**Columns:**
- **TYPE**: GPS, MI (Manual Input), DRN (Driver Report), IMP (Impound), or BLOCKED
- **CLIENT**: Client name (matches clients.csv)
- **YEAR**: Vehicle year
- **MAKE**: Vehicle make
- **MODEL**: Vehicle model
- **COLOR**: Vehicle color
- **TAG**: License plate
- **VIN**: 17-character VIN
- **STREET**: Street address
- **CITY**: City name
- **ZIP**: Zip code
- **GPS**: GPS coordinates in format "lat, lng" (e.g., "39.2904, -76.6122")
- **SPOTTER**: Spotter name or empty
- **DRIVER**: Assigned driver name (matches drivers.csv) or empty
- **NOTES**: Optional notes (can include coordinates again)
- **STATUS**: Located, Dispatched, Towed, Stashed, or Blocked

**Requirements:**
- 200-300 vehicles total
- Distribute across all markets
- Status distribution:
  - 40% Located
  - 15% Dispatched
  - 25% Towed
  - 10% Stashed
  - 8% Blocked
  - 2% Others
- Realistic addresses within each market
- Valid VINs (17 alphanumeric, excluding I, O, Q)
- License plates should vary by state (MD, TX, AZ, GA formats)
- GPS coordinates within market bounds

**Address Examples by Market:**
- Baltimore: Use Baltimore, Annapolis, Columbia, Glen Burnie, etc.
- Dallas: Use Dallas, Plano, Irving, Arlington, etc.
- Phoenix: Use Phoenix, Mesa, Glendale, Scottsdale, etc.
- Atlanta: Use Atlanta, Marietta, Roswell, Sandy Springs, etc.

**Example:**
```csv
TYPE,CLIENT,YEAR,MAKE,MODEL,COLOR,TAG,VIN,STREET,CITY,ZIP,GPS,SPOTTER,DRIVER,NOTES,STATUS
GPS,Capital One,2019,Honda,Civic,Silver,MD-ABC123,5J6RM4H79KL012345,123 Main St,Baltimore,21201,"39.2904, -76.6122",,John Smith,Located,Located
MI,Wells Fargo,2020,Toyota,Camry,White,TX-XYZ789,4T1BF1FK2JU123456,456 Oak Ave,Dallas,75201,"32.7767, -96.7970",Maria Garcia,Maria Garcia,Dispatched,Dispatched
GPS,Chase Bank,2018,Ford,F-150,Black,PHX-ABC12,1FTFW1E55MFA12345,789 Elm St,Phoenix,85001,"33.4484, -112.0740",,,Located,Located
DRN,Bank of America,2021,Nissan,Altima,Blue,GA-123ABC,1N4AL3AP8JC123456,321 Pine Rd,Atlanta,30301,"33.7490, -84.3880",David Lee,David Lee,Completed,Towed
```

**Important Notes:**
- GPS column can contain coordinates in format "lat, lng" (with space after comma)
- If STATUS is "Dispatched" or "Towed", DRIVER should be populated
- NOTES field can repeat coordinates if needed
- TYPE "BLOCKED" should have STATUS "Blocked"

---

### 7. **user-profiles.csv** (Optional - for authentication)
Format: `id,email,full_name,role,market`

**Columns:**
- **id**: Simple ID (usr-001, etc.) - Note: This will link to Supabase auth.users
- **email**: Email address
- **full_name**: Full name
- **role**: admin, dispatcher, manager, driver, or spotter
- **market**: Market name or empty

**Requirements:**
- 15-25 users total
- 2-3 admins
- 3-5 dispatchers
- 2-3 managers
- 8-12 drivers (should match drivers.csv names)
- 3-5 spotters

**Example:**
```csv
id,email,full_name,role,market
usr-001,admin@premiumrecovery.com,Admin User,admin,
usr-002,dispatcher1@premiumrecovery.com,Jane Dispatcher,dispatcher,Baltimore
usr-003,john.smith@premiumrecovery.com,John Smith,driver,Baltimore
usr-004,maria.garcia@premiumrecovery.com,Maria Garcia,driver,Baltimore
```

---

### 8. **spotter-submissions.csv** (Optional)
Format: `id,spotter_name,client,vin,year,make,model,color,plate,address,reachable,rusted,location_type,parked_type,notes,status,created_at`

**Columns:**
- **id**: Simple ID (spot-001, etc.)
- **spotter_name**: Spotter name
- **client**: Client name
- **vin**: 17-character VIN
- **year**: Year
- **make**: Make
- **model**: Model
- **color**: Color
- **plate**: License plate
- **address**: Full address
- **reachable**: Reachable or Not reachable
- **rusted**: Rusted or Not rusted
- **location_type**: Apartment Secured, Single Family Home, Parking Lot Secured, etc.
- **parked_type**: Pulled in, Backed in, or Parallel
- **notes**: Notes (comma-separated if multiple)
- **status**: pending, verified, duplicate, or rejected
- **created_at**: ISO timestamp

**Requirements:**
- 50-100 submissions total
- Mix of statuses (60% verified, 25% pending, 10% duplicate, 5% rejected)
- Realistic data

---

## DATA CONSISTENCY REQUIREMENTS:

1. **Market Names**: Must match exactly across all files (Baltimore, Dallas, Phoenix, Atlanta)
2. **Zone Names**: Must match markets-zones.csv exactly
3. **Client Names**: Must match clients.csv exactly in located-vehicles.csv
4. **Driver Names**: Must match drivers.csv exactly where referenced
5. **Storage Lot Names**: Must match storage-lots.csv exactly
6. **Geographic Consistency**: 
   - Coordinates within market bounds
   - Cities match markets
   - Zip codes valid for cities
7. **VIN Format**: Valid 17-character VINs (no I, O, Q)
8. **License Plates**: State-appropriate formats
   - MD: Format like "ABC123" or "1AB2345"
   - TX: Format like "ABC-1234"
   - AZ: Format like "ABC1234"
   - GA: Format like "ABC1234"

---

## OUTPUT FORMAT:

Generate each CSV file as a separate response or clearly separated sections. Each file should:
- Have a header row with exact column names
- Use proper CSV escaping (quotes around fields with commas, quotes escaped as "")
- Use consistent date/time formats
- Be ready to save directly to files

**File Naming Convention:**
Save files as:
- `markets-zones.csv`
- `clients.csv`
- `storage-lots.csv`
- `drivers.csv`
- `fleet-vehicles.csv`
- `located-vehicles.csv`
- `user-profiles.csv` (optional)
- `spotter-submissions.csv` (optional)

---

## VOLUME REQUIREMENTS:

- **Markets**: 4
- **Zones**: 12-20 total (3-5 per market)
- **Storage Lots**: 8-16 total (2-4 per market)
- **Clients**: 15-25
- **Drivers**: 8-12
- **Fleet Vehicles**: 15-25
- **Located Vehicles**: 200-300 (MAIN FILE)
- **User Profiles**: 15-25 (optional)
- **Spotter Submissions**: 50-100 (optional)

---

## ADDITIONAL NOTES:

1. Use realistic American names, addresses, and phone numbers
2. Vehicle makes/models should be common and realistic pairings
3. VINs should follow valid format (17 alphanumeric, excluding I, O, Q)
4. License plates should vary by state appropriately
5. Most data should represent "active" operations
6. Mix of statuses to show workflow progression
7. Coordinates must be within market geographic bounds
8. All relationships must be consistent (foreign keys match)

Generate all CSV files now. Start with markets-zones.csv, then clients.csv, storage-lots.csv, drivers.csv, fleet-vehicles.csv, and finally the large located-vehicles.csv file. Ensure all relationships are consistent across files.


