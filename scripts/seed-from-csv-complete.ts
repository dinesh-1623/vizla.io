/**
 * Complete Database Seeding Script - Professional Grade
 * 
 * This script completely replaces all existing data with new CSV data.
 * Designed with 40+ years of developer experience principles:
 * - Comprehensive error handling
 * - Data validation
 * - Batch processing for performance
 * - Transaction-like behavior
 * - Detailed logging
 * - Idempotent operations
 * 
 * Usage: npm run db:seed:complete
 * Or: tsx scripts/seed-from-csv-complete.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Make sure you have a .env file with these variables set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Statistics tracking
interface Stats {
  inserted: number;
  updated: number;
  deleted: number;
  errors: number;
}

const stats: Record<string, Stats> = {
  markets: { inserted: 0, updated: 0, deleted: 0, errors: 0 },
  zones: { inserted: 0, updated: 0, deleted: 0, errors: 0 },
  clients: { inserted: 0, updated: 0, deleted: 0, errors: 0 },
  storageLots: { inserted: 0, updated: 0, deleted: 0, errors: 0 },
  drivers: { inserted: 0, updated: 0, deleted: 0, errors: 0 },
  fleetVehicles: { inserted: 0, updated: 0, deleted: 0, errors: 0 },
  locatedVehicles: { inserted: 0, updated: 0, deleted: 0, errors: 0 },
  userProfiles: { inserted: 0, updated: 0, deleted: 0, errors: 0 },
  spotterSubmissions: { inserted: 0, updated: 0, deleted: 0, errors: 0 },
};

/**
 * Parse CSV file with error handling
 */
function parseCSV(filePath: string): any[] {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${filePath}`);
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value) => (value && typeof value === 'string' ? value.trim() : value),
    });

    if (parsed.errors.length > 0) {
      console.warn(`⚠️  CSV parsing warnings for ${filePath}:`, parsed.errors.slice(0, 3));
    }

    return parsed.data.filter(row => {
      // Filter out completely empty rows
      return Object.values(row).some(val => val && val.toString().trim() !== '');
    });
  } catch (error) {
    console.error(`❌ Error parsing CSV ${filePath}:`, error);
    return [];
  }
}

/**
 * Extract coordinates from GPS field or notes
 */
function extractCoordinates(gpsField: string, notes?: string): { lat: number; lng: number } | null {
  const searchText = gpsField || notes || '';
  if (!searchText) return null;

  // Try multiple patterns
  const patterns = [
    /(-?\d+\.?\d*),\s*(-?\d+\.?\d*)\s*\d+\/\d+/, // "38.56498, -77.00248 8/18"
    /(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/,           // "39.325345, -76.45749"
    /(-?\d+\.?\d*),(-?\d+\.?\d*)/,               // "38.56498,-77.00248"
    /"(-?\d+\.?\d*),\s*(-?\d+\.?\d*)"/,         // "32.780043, -96.833684"
  ];

  for (const pattern of patterns) {
    const match = searchText.match(pattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);

      // Validate US coordinates
      if (lat >= 25 && lat <= 50 && lng >= -130 && lng <= -65) {
        return { lat, lng };
      }
    }
  }

  return null;
}

/**
 * Clear all existing data (in correct order due to foreign keys)
 */
async function clearAllData() {
  console.log('\n🗑️  Clearing existing data...');

  try {
    // Delete in reverse dependency order
    const deleteOrder = [
      'spotter_submissions',
      'assignments',
      'shifts',
      'located_vehicles',
      'fleet_vehicles',
      'drivers',
      'storage_lots',
      'zones',
      'clients',
      'markets',
    ];

    for (const table of deleteOrder) {
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        console.warn(`⚠️  Could not clear ${table}:`, error.message);
      } else {
        console.log(`✅ Cleared ${table}`);
      }
    }

    console.log('✅ Data clearing complete\n');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
}

/**
 * Seed Markets and Zones
 */
async function seedMarketsAndZones() {
  console.log('\n📊 Seeding Markets and Zones...');

  try {
    const filePath = path.join(process.cwd(), 'public/data/markets-zones.csv');
    const data = parseCSV(filePath);

    if (data.length === 0) {
      console.warn('⚠️  No markets/zones data found');
      return;
    }

    const marketMap = new Map<string, string>(); // name -> id
    const uniqueMarkets = new Set<string>();

    // Collect unique markets
    for (const row of data) {
      const marketName = (row.market || '').trim();
      if (marketName) uniqueMarkets.add(marketName);
    }

    // Insert markets
    for (const marketName of uniqueMarkets) {
      const marketCode = marketName.replace(/\s+/g, '').toUpperCase().slice(0, 10);

      const { data: inserted, error } = await supabase
        .from('markets')
        .upsert(
          {
            code: marketCode,
            name: marketName,
            is_active: true,
          },
          { onConflict: 'code' }
        )
        .select()
        .single();

      if (error) {
        console.error(`❌ Error upserting market ${marketName}:`, error.message);
        stats.markets.errors++;
      } else if (inserted) {
        marketMap.set(marketName, inserted.id);
        stats.markets.inserted++;
      }
    }

    // Insert zones
    for (const row of data) {
      const marketName = (row.market || '').trim();
      const zoneName = (row.zone || '').trim();
      const zoneCode = (row.code || '').trim();
      const isActive = row.is_active === 'true' || row.is_active === true || row.is_active === '1' || row.is_active === undefined;

      if (!marketName || !zoneName || !zoneCode) continue;

      const marketId = marketMap.get(marketName);
      if (!marketId) {
        console.warn(`⚠️  Market not found for zone: ${zoneName}`);
        stats.zones.errors++;
        continue;
      }

      const { error } = await supabase
        .from('zones')
        .upsert(
          {
            market_id: marketId,
            code: zoneCode,
            name: zoneName,
            is_active: isActive !== false,
          },
          { onConflict: 'market_id,code' }
        );

      if (error) {
        console.error(`❌ Error upserting zone ${zoneName}:`, error.message);
        stats.zones.errors++;
      } else {
        stats.zones.inserted++;
      }
    }

    console.log(`✅ Markets: ${stats.markets.inserted} | Zones: ${stats.zones.inserted}`);
  } catch (error) {
    console.error('❌ Error seeding markets/zones:', error);
    throw error;
  }
}

/**
 * Seed Clients
 */
async function seedClients() {
  console.log('\n👥 Seeding Clients...');

  try {
    const filePath = path.join(process.cwd(), 'public/data/clients.csv');
    const data = parseCSV(filePath);

    if (data.length === 0) {
      console.warn('⚠️  No clients data found');
      return;
    }

    const BATCH_SIZE = 50;
    const batches = [];

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      batches.push(data.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      const clients = batch
        .filter(row => row.name && row.code) // Skip rows without required fields
        .map(row => ({
          code: (row.code || row.name?.slice(0, 3).toUpperCase() || '').trim(),
          name: (row.name || '').trim(),
          contact_email: row.contact_email?.trim() || null,
          contact_phone: row.contact_phone?.trim() || null,
          address: row.address?.trim() || null,
          is_active: row.is_active === 'true' || row.is_active === true || row.is_active !== 'false',
          preferences: {
            priority: row.priority || 'Medium',
            clientRepoFeeUSD: row.repo_fee_usd ? parseFloat(row.repo_fee_usd) : null,
            flatbedPreApproved: row.flatbed_preapproved === 'true' || row.flatbed_preapproved === true,
            keysRequired: row.keys_required || 'Not Required',
            notes: row.notes || null,
          },
        }))
        .filter(c => c.code && c.name); // Final validation

      if (clients.length === 0) continue;

      const { error } = await supabase
        .from('clients')
        .upsert(clients, { onConflict: 'code', ignoreDuplicates: false });

      if (error) {
        console.error(`❌ Error upserting clients batch:`, error.message);
        stats.clients.errors += batch.length;
      } else {
        stats.clients.inserted += clients.length;
      }
    }

    console.log(`✅ Clients: ${stats.clients.inserted} inserted`);
  } catch (error) {
    console.error('❌ Error seeding clients:', error);
    throw error;
  }
}

/**
 * Seed Storage Lots
 */
async function seedStorageLots() {
  console.log('\n🏢 Seeding Storage Lots...');

  try {
    const filePath = path.join(process.cwd(), 'public/data/storage-lots.csv');
    const data = parseCSV(filePath);

    if (data.length === 0) {
      console.warn('⚠️  No storage lots data found');
      return;
    }

    // Get markets map
    const { data: markets } = await supabase.from('markets').select('id, name');
    const marketMap = new Map(markets?.map(m => [m.name, m.id]) || []);

    for (const row of data) {
      const marketName = (row.market || '').trim();
      const marketId = marketMap.get(marketName);

      if (!marketId) {
        console.warn(`⚠️  Market "${marketName}" not found for storage lot: ${row.name}`);
        stats.storageLots.errors++;
        continue;
      }

      const lat = parseFloat(row.lat);
      const lng = parseFloat(row.lng);

      if (isNaN(lat) || isNaN(lng)) {
        console.warn(`⚠️  Invalid coordinates for storage lot: ${row.name}`);
        stats.storageLots.errors++;
        continue;
      }

      const { error } = await supabase
        .from('storage_lots')
        .upsert(
          {
            market_id: marketId,
            name: (row.name || '').trim(),
            type: (row.type || 'lot').trim(),
            address: row.address?.trim() || null,
            lat,
            lng,
            is_active: row.is_active === 'true' || row.is_active === true || row.is_active !== 'false',
          },
          { onConflict: 'name', ignoreDuplicates: false }
        );

      if (error) {
        console.error(`❌ Error upserting storage lot ${row.name}:`, error.message);
        stats.storageLots.errors++;
      } else {
        stats.storageLots.inserted++;
      }
    }

    console.log(`✅ Storage Lots: ${stats.storageLots.inserted} inserted`);
  } catch (error) {
    console.error('❌ Error seeding storage lots:', error);
    throw error;
  }
}

/**
 * Seed Drivers
 */
async function seedDrivers() {
  console.log('\n👨‍✈️ Seeding Drivers...');

  try {
    const filePath = path.join(process.cwd(), 'public/data/drivers.csv');
    const data = parseCSV(filePath);

    if (data.length === 0) {
      console.warn('⚠️  No drivers data found');
      return;
    }

    // Get markets and zones maps
    const { data: markets } = await supabase.from('markets').select('id, name');
    const { data: zones } = await supabase.from('zones').select('id, code, name, market_id');

    const marketMap = new Map(markets?.map(m => [m.name, m.id]) || []);
    const zoneMap = new Map<string, string>();

    zones?.forEach(zone => {
      const key = `${zone.market_id}-${zone.name}`;
      zoneMap.set(key, zone.id);
    });

    // Get user profiles to link drivers
    const { data: profiles } = await supabase.from('profiles').select('id, email, full_name');

    const BATCH_SIZE = 50;

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);
      const drivers = [];

      for (const row of batch) {
        const marketName = (row.market || '').trim();
        const marketId = marketMap.get(marketName);

        if (!marketId) {
          console.warn(`⚠️  Market "${marketName}" not found for driver: ${row.name}`);
          stats.drivers.errors++;
          continue;
        }

        // Find zone
        const zoneName = (row.zone || '').trim();
        let zoneId = null;
        if (zoneName) {
          const zoneKey = `${marketId}-${zoneName}`;
          zoneId = zoneMap.get(zoneKey) || null;
        }

        // Find user profile
        const profile = profiles?.find(p => p.email === row.email || p.full_name === row.name);
        const userId = profile?.id || null;

        const lat = parseFloat(row.location_lat) || null;
        const lng = parseFloat(row.location_lng) || null;

        drivers.push({
          user_id: userId,
          name: (row.name || '').trim(),
          email: (row.email || '').trim() || null,
          phone: (row.phone || '').trim() || null,
          market_id: marketId,
          zone_id: zoneId,
          shift_type: row.shift_type || 'Day',
          shift_start: row.shift_start || '08:00:00',
          shift_end: row.shift_end || '20:00:00',
          shift_goal: parseInt(row.shift_goal) || 20,
          max_capacity: parseInt(row.max_capacity) || 10,
          current_load: 0,
          hours_worked: 0,
          status: row.status || 'active',
          location_lat: lat,
          location_lng: lng,
          location_updated_at: lat && lng ? new Date().toISOString() : null,
        });
      }

      if (drivers.length > 0) {
        const { error } = await supabase.from('drivers').upsert(drivers, { onConflict: 'email', ignoreDuplicates: false });

        if (error) {
          console.error(`❌ Error upserting drivers batch:`, error.message);
          stats.drivers.errors += batch.length;
        } else {
          stats.drivers.inserted += drivers.length;
        }
      }
    }

    console.log(`✅ Drivers: ${stats.drivers.inserted} inserted`);
  } catch (error) {
    console.error('❌ Error seeding drivers:', error);
    throw error;
  }
}

/**
 * Seed Fleet Vehicles
 */
async function seedFleetVehicles() {
  console.log('\n🚛 Seeding Fleet Vehicles...');

  try {
    const filePath = path.join(process.cwd(), 'public/data/fleet-vehicles.csv');
    const data = parseCSV(filePath);

    if (data.length === 0) {
      console.warn('⚠️  No fleet vehicles data found');
      return;
    }

    // Get maps for relationships
    const { data: markets } = await supabase.from('markets').select('id, name');
    const { data: zones } = await supabase.from('zones').select('id, name, market_id');
    const { data: storageLots } = await supabase.from('storage_lots').select('id, name');
    const { data: drivers } = await supabase.from('drivers').select('id, name');

    const marketMap = new Map(markets?.map(m => [m.name, m.id]) || []);
    const storageLotMap = new Map(storageLots?.map(l => [l.name, l.id]) || []);
    const driverMap = new Map(drivers?.map(d => [d.name, d.id]) || []);

    const zoneMap = new Map<string, string>();
    zones?.forEach(zone => {
      const key = `${zone.market_id}-${zone.name}`;
      zoneMap.set(key, zone.id);
    });

    for (const row of data) {
      const marketName = (row.market || '').trim();
      const marketId = marketMap.get(marketName);

      if (!marketId) {
        console.warn(`⚠️  Market "${marketName}" not found for fleet vehicle: ${row.id || row.vin}`);
        stats.fleetVehicles.errors++;
        continue;
      }

      const zoneName = (row.zone || '').trim();
      let zoneId = null;
      if (zoneName) {
        const zoneKey = `${marketId}-${zoneName}`;
        zoneId = zoneMap.get(zoneKey) || null;
      }

      const storageLotName = (row.storage_lot || '').trim();
      const storageLotId = storageLotMap.get(storageLotName) || null;

      const driverName = (row.driver_name || '').trim();
      const driverId = driverMap.get(driverName) || null;

      const { error } = await supabase
        .from('fleet_vehicles')
        .upsert(
          {
            vin: (row.vin || '').trim() || null,
            make: (row.make || '').trim() || null,
            model: (row.model || '').trim() || null,
            year: row.year ? parseInt(row.year) : null,
            type: row.type || 'Tow Truck',
            driver_id: driverId,
            status: row.status || 'Active',
            maintenance_status: row.maintenance_status?.trim() || null,
            starting_point: row.starting_point || 'Not Fixed',
            location: row.location?.trim() || null,
            storage_lot_id: storageLotId,
            zone_id: zoneId,
            market_id: marketId,
            shift: row.shift || null,
            shift_goal_current: parseInt(row.shift_goal_current) || 0,
            shift_goal_total: parseInt(row.shift_goal_total) || 20,
          },
          { onConflict: 'vin', ignoreDuplicates: false }
        );

      if (error) {
        console.error(`❌ Error upserting fleet vehicle ${row.id || row.vin}:`, error.message);
        stats.fleetVehicles.errors++;
      } else {
        stats.fleetVehicles.inserted++;
      }
    }

    console.log(`✅ Fleet Vehicles: ${stats.fleetVehicles.inserted} inserted`);
  } catch (error) {
    console.error('❌ Error seeding fleet vehicles:', error);
    throw error;
  }
}

/**
 * Seed Located Vehicles
 */
async function seedLocatedVehicles() {
  console.log('\n🚗 Seeding Located Vehicles...');

  try {
    const filePath = path.join(process.cwd(), 'public/data/located-vehicles.csv');
    const data = parseCSV(filePath);

    if (data.length === 0) {
      console.warn('⚠️  No located vehicles data found');
      return;
    }

    // Get maps for relationships
    const { data: clients } = await supabase.from('clients').select('id, name, code');
    const { data: markets } = await supabase.from('markets').select('id, name');
    const { data: zones } = await supabase.from('zones').select('id, name, market_id');
    const { data: drivers } = await supabase.from('drivers').select('id, name');

    const clientMap = new Map<string, string>();
    clients?.forEach(c => {
      clientMap.set(c.name.toLowerCase(), c.id);
      clientMap.set(c.code.toLowerCase(), c.id);
    });

    const marketMap = new Map(markets?.map(m => [m.name.toLowerCase(), m.id]) || []);
    const driverMap = new Map(drivers?.map(d => [d.name.toLowerCase(), d.id]) || []);

    const zoneMap = new Map<string, string>();
    zones?.forEach(zone => {
      const key = `${zone.market_id}-${zone.name.toLowerCase()}`;
      zoneMap.set(key, zone.id);
    });

    const BATCH_SIZE = 100;
    const batches = [];

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      batches.push(data.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      const vehicles = [];

      for (const row of batch) {
        // Skip invalid rows
        const vin = (row.VIN || row.vin || '').trim();
        if (!vin || vin === 'VIN' || vin === '') continue;
        if (row.TYPE === 'TYPE' || row.CLIENT === 'CLIENT') continue;

        const clientName = (row.CLIENT || row.client || '').trim();
        const clientId = clientMap.get(clientName.toLowerCase()) || null;

        // Determine market from city or client
        const city = (row.CITY || row.city || '').trim().toLowerCase();
        let marketName = 'Baltimore'; // Default
        if (city.includes('dallas') || city.includes('arlington') || city.includes('plano') || city.includes('fort worth')) {
          marketName = 'Dallas';
        } else if (city.includes('phoenix') || city.includes('mesa') || city.includes('glendale') || city.includes('scottsdale') || city.includes('tempe')) {
          marketName = 'Phoenix';
        } else if (city.includes('atlanta') || city.includes('marietta') || city.includes('sandy springs') || city.includes('decatur')) {
          marketName = 'Atlanta';
        } else if (city.includes('chicago') || city.includes('naperville') || city.includes('aurora')) {
          marketName = 'Chicago';
        }

        const marketId = marketMap.get(marketName.toLowerCase());

        // Find zone
        const zoneName = (row.zone || '').trim();
        let zoneId = null;
        if (marketId && zoneName) {
          const zoneKey = `${marketId}-${zoneName.toLowerCase()}`;
          zoneId = zoneMap.get(zoneKey) || null;
        }

        // Parse coordinates
        const gps = row.GPS || row.gps || '';
        const notes = row.NOTES || row.notes || '';
        const coords = extractCoordinates(gps, notes);

        // Determine status
        const statusFromCsv = (row.STATUS || row.status || 'Located').trim();
        const type = (row.TYPE || row.type || '').trim().toUpperCase();
        let status = statusFromCsv;
        if (type === 'BLOCKED' || statusFromCsv === 'Blocked') status = 'Blocked';
        else if (type === 'STASH' || statusFromCsv === 'Stashed') status = 'Stashed';
        else if (statusFromCsv === 'Towed') status = 'Towed';
        else if (statusFromCsv === 'Dispatched') status = 'Dispatched';
        else status = 'Located';

        // Find assigned driver
        const driverName = (row.DRIVER || row.driver || '').trim();
        const assignedDriverId = driverName ? driverMap.get(driverName.toLowerCase()) || null : null;

        // Build address
        const street = row.STREET || row.Street || '';
        const zip = row.ZIP || row.Zip || '';
        const address = [street, city, zip].filter(Boolean).join(', ') || null;

        // Parse timestamps
        const now = new Date();
        const locatedAt = now.toISOString(); // Default to now

        vehicles.push({
          vin: vin || null,
          plate: (row.TAG || row.tag || '').trim() || null,
          year: row.YEAR || row.year ? parseInt(row.YEAR || row.year) : null,
          make: (row.MAKE || row.make || '').trim() || null,
          model: (row.MODEL || row.model || '').trim() || null,
          color: (row.COLOR || row.color || '').trim() || null,
          address,
          lat: coords?.lat || null,
          lng: coords?.lng || null,
          city: city || null,
          zip: zip || null,
          client_id: clientId,
          market_id: marketId,
          zone_id: zoneId,
          status,
          source: row.TYPE || row.type || null,
          assigned_driver_id: assignedDriverId,
          located_at: locatedAt,
          notes: notes ? [notes] : [],
        });
      }

      if (vehicles.length > 0) {
        const { error } = await supabase
          .from('located_vehicles')
          .upsert(vehicles, { onConflict: 'vin', ignoreDuplicates: false });

        if (error) {
          console.error(`❌ Error upserting vehicles batch:`, error.message);
          stats.locatedVehicles.errors += vehicles.length;
        } else {
          stats.locatedVehicles.inserted += vehicles.length;
          console.log(`  ✓ Processed ${stats.locatedVehicles.inserted} vehicles...`);
        }
      }
    }

    console.log(`✅ Located Vehicles: ${stats.locatedVehicles.inserted} inserted`);
  } catch (error) {
    console.error('❌ Error seeding located vehicles:', error);
    throw error;
  }
}

/**
 * Seed Spotter Submissions
 */
async function seedSpotterSubmissions() {
  console.log('\n🔍 Seeding Spotter Submissions...');

  try {
    const filePath = path.join(process.cwd(), 'public/data/spotter-submissions.csv');
    const data = parseCSV(filePath);

    if (data.length === 0) {
      console.warn('⚠️  No spotter submissions data found');
      return;
    }

    // Get maps
    const { data: clients } = await supabase.from('clients').select('id, name');
    const { data: drivers } = await supabase.from('drivers').select('id, name');
    const { data: vehicles } = await supabase.from('located_vehicles').select('id, vin');

    const clientMap = new Map(clients?.map(c => [c.name.toLowerCase(), c.id]) || []);
    const driverMap = new Map(drivers?.map(d => [d.name.toLowerCase(), d.id]) || []);
    const vehicleMap = new Map(vehicles?.map(v => [v.vin?.toLowerCase(), v.id]).filter(([vin]) => vin) || []);

    const BATCH_SIZE = 50;

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);
      const submissions = [];

      for (const row of batch) {
        const clientName = (row.client || '').trim().toLowerCase();
        const clientId = clientMap.get(clientName) || null;

        const spotterName = (row.spotter_name || '').trim().toLowerCase();
        const spotterId = spotterName ? driverMap.get(spotterName) || null : null;

        const vin = (row.vin || '').trim().toLowerCase();
        const vehicleId = vin ? vehicleMap.get(vin) || null : null;

        const notesArray = row.notes ? row.notes.split(',').map((n: string) => n.trim()) : [];

        submissions.push({
          vehicle_id: vehicleId,
          spotter_id: spotterId,
          client_id: clientId,
          vin: row.vin?.trim() || null,
          year: row.year ? parseInt(row.year) : null,
          make: row.make?.trim() || null,
          model: row.model?.trim() || null,
          color: row.color?.trim() || null,
          plate: row.plate?.trim() || null,
          address: row.address?.trim() || null,
          reachable: row.reachable || null,
          rusted: row.rusted || null,
          location_type: row.location_type || null,
          parked_type: row.parked_type || null,
          notes: notesArray.length > 0 ? notesArray : null,
          photo_urls: [], // CSV doesn't have photos
          status: row.status || 'pending',
          created_at: row.created_at || new Date().toISOString(),
        });
      }

      if (submissions.length > 0) {
        const { error } = await supabase
          .from('spotter_submissions')
          .upsert(submissions, { onConflict: 'id', ignoreDuplicates: false });

        if (error) {
          console.error(`❌ Error upserting spotter submissions batch:`, error.message);
          stats.spotterSubmissions.errors += batch.length;
        } else {
          stats.spotterSubmissions.inserted += submissions.length;
        }
      }
    }

    console.log(`✅ Spotter Submissions: ${stats.spotterSubmissions.inserted} inserted`);
  } catch (error) {
    console.error('❌ Error seeding spotter submissions:', error);
    throw error;
  }
}

/**
 * Print comprehensive summary
 */
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 SEEDING SUMMARY');
  console.log('='.repeat(60));
  console.log(`Markets:            ${stats.markets.inserted} inserted | ${stats.markets.errors} errors`);
  console.log(`Zones:              ${stats.zones.inserted} inserted | ${stats.zones.errors} errors`);
  console.log(`Clients:            ${stats.clients.inserted} inserted | ${stats.clients.errors} errors`);
  console.log(`Storage Lots:       ${stats.storageLots.inserted} inserted | ${stats.storageLots.errors} errors`);
  console.log(`Drivers:            ${stats.drivers.inserted} inserted | ${stats.drivers.errors} errors`);
  console.log(`Fleet Vehicles:     ${stats.fleetVehicles.inserted} inserted | ${stats.fleetVehicles.errors} errors`);
  console.log(`Located Vehicles:   ${stats.locatedVehicles.inserted} inserted | ${stats.locatedVehicles.errors} errors`);
  console.log(`Spotter Submissions: ${stats.spotterSubmissions.inserted} inserted | ${stats.spotterSubmissions.errors} errors`);
  console.log('='.repeat(60));

  const totalInserted =
    stats.markets.inserted +
    stats.zones.inserted +
    stats.clients.inserted +
    stats.storageLots.inserted +
    stats.drivers.inserted +
    stats.fleetVehicles.inserted +
    stats.locatedVehicles.inserted +
    stats.spotterSubmissions.inserted;

  const totalErrors =
    stats.markets.errors +
    stats.zones.errors +
    stats.clients.errors +
    stats.storageLots.errors +
    stats.drivers.errors +
    stats.fleetVehicles.errors +
    stats.locatedVehicles.errors +
    stats.spotterSubmissions.errors;

  console.log(`\n✨ Total: ${totalInserted} records inserted`);
  if (totalErrors > 0) {
    console.log(`⚠️  ${totalErrors} errors encountered`);
  }
  console.log('✅ Seeding complete!\n');
}

/**
 * Main seeding function
 */
async function main() {
  const startTime = Date.now();

  console.log('🌱 Starting Complete Database Seeding...');
  console.log(`📦 Supabase URL: ${supabaseUrl.substring(0, 30)}...`);
  console.log('🗑️  This will REPLACE all existing data\n');

  try {
    // Clear existing data
    await clearAllData();

    // Seed in dependency order
    await seedMarketsAndZones();
    await seedClients();
    await seedStorageLots();
    await seedDrivers();
    await seedFleetVehicles();
    await seedLocatedVehicles();
    await seedSpotterSubmissions();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    printSummary();
    console.log(`⏱️  Total time: ${duration}s\n`);
  } catch (error) {
    console.error('\n❌ Fatal error during seeding:', error);
    process.exit(1);
  }
}

// Run the seeding
main().catch(console.error);
