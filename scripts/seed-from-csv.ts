/**
 * CSV Seeding Script for Vizla Dashboard
 * 
 * Idempotent seeding from CSV files to Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Statistics
const stats = {
  markets: { inserted: 0, updated: 0, skipped: 0 },
  zones: { inserted: 0, updated: 0, skipped: 0 },
  clients: { inserted: 0, updated: 0, skipped: 0 },
  storageLots: { inserted: 0, updated: 0, skipped: 0 },
  vehicles: { inserted: 0, updated: 0, skipped: 0 },
};

/**
 * Parse CSV file
 */
function parseCSV(filePath: string): any[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = Papa.parse(content, { 
    header: true, 
    skipEmptyLines: true,
    transformHeader: (header) => header.trim() 
  });
  return parsed.data as any[];
}

/**
 * Parse JSON file
 */
function parseJSON(filePath: string): any[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Extract lat/lng from notes field
 */
function extractCoordinates(notes: string): { lat: number; lng: number } | null {
  if (!notes) return null;
  
  const match = notes.match(/[-+]?[0-9]*\.?[0-9]+,\s*[-+]?[0-9]*\.?[0-9]+/);
  if (!match) return null;
  
  const [lat, lng] = match[0].split(',').map(s => parseFloat(s.trim()));
  if (isNaN(lat) || isNaN(lng)) return null;
  
  return { lat, lng };
}

/**
 * Seed Markets and Zones
 */
async function seedMarketsAndZones() {
  console.log('\n📊 Seeding Markets and Zones...');
  
  try {
    const filePath = path.join(process.cwd(), 'public/data/markets-zones.csv');
    const data = parseCSV(filePath);
    
    const marketMap = new Map<string, string>(); // name -> id
    
    // Upsert markets
    for (const row of data) {
      const marketName = row.market?.trim();
      const marketCode = row.market?.trim().replace(/\s+/g, '').toUpperCase().slice(0, 4);
      
      if (!marketName) continue;
      
      const { data: existing } = await supabase
        .from('markets')
        .select('id, code')
        .eq('code', marketCode)
        .single();
      
      if (existing) {
        marketMap.set(marketName, existing.id);
        stats.markets.skipped++;
      } else {
        const { data: inserted, error } = await supabase
          .from('markets')
          .upsert({
            code: marketCode,
            name: marketName,
            is_active: true
          }, { onConflict: 'code' })
          .select()
          .single();
        
        if (inserted) {
          marketMap.set(marketName, inserted.id);
          stats.markets.inserted++;
        }
      }
    }
    
    // Upsert zones
    for (const row of data) {
      const marketName = row.market?.trim();
      const zoneName = row.zone?.trim();
      const zoneCode = row.code?.trim();
      
      if (!marketName || !zoneName || !zoneCode) continue;
      
      const marketId = marketMap.get(marketName);
      if (!marketId) continue;
      
      const { data: existing } = await supabase
        .from('zones')
        .select('id')
        .eq('market_id', marketId)
        .eq('code', zoneCode)
        .single();
      
      if (existing) {
        stats.zones.skipped++;
      } else {
        const { error } = await supabase
          .from('zones')
          .upsert({
            market_id: marketId,
            code: zoneCode,
            name: zoneName,
            is_active: true
          }, { onConflict: 'market_id,code' });
        
        if (!error) {
          stats.zones.inserted++;
        }
      }
    }
    
    console.log(`✅ Markets: ${stats.markets.inserted} inserted, ${stats.markets.skipped} skipped`);
    console.log(`✅ Zones: ${stats.zones.inserted} inserted, ${stats.zones.skipped} skipped`);
  } catch (error) {
    console.error('❌ Error seeding markets/zones:', error);
  }
}

/**
 * Seed Clients
 */
async function seedClients() {
  console.log('\n👥 Seeding Clients...');
  
  try {
    const filePath = path.join(process.cwd(), 'public/data/clients.json');
    const data = parseJSON(filePath);
    
    for (const client of data) {
      const clientCode = client.name?.slice(0, 3).toUpperCase();
      
      const { data: existing } = await supabase
        .from('clients')
        .select('id')
        .eq('code', clientCode)
        .single();
      
      if (existing) {
        stats.clients.skipped++;
        continue;
      }
      
      const { error } = await supabase
        .from('clients')
        .insert({
          code: clientCode,
          name: client.name,
          contact_phone: client.phone,
          address: client.address,
          is_active: true
        });
      
      if (!error) {
        stats.clients.inserted++;
      }
    }
    
    console.log(`✅ Clients: ${stats.clients.inserted} inserted, ${stats.clients.skipped} skipped`);
  } catch (error) {
    console.error('❌ Error seeding clients:', error);
  }
}

/**
 * Seed Storage Lots
 */
async function seedStorageLots() {
  console.log('\n🏢 Seeding Storage Lots...');
  
  try {
    const filePath = path.join(process.cwd(), 'public/data/storage-lots.json');
    const data = parseJSON(filePath);
    
    // Get all markets to map by name
    const { data: markets } = await supabase
      .from('markets')
      .select('id, name');
    
    const marketMap = new Map(markets?.map(m => [m.name, m.id]) || []);
    
    for (const lot of data) {
      const { data: existing } = await supabase
        .from('storage_lots')
        .select('id')
        .eq('name', lot.name)
        .single();
      
      if (existing) {
        stats.storageLots.skipped++;
        continue;
      }
      
      // Default to first market if not specified
      const marketId = lot.market_id || markets?.[0]?.id;
      
      const { error } = await supabase
        .from('storage_lots')
        .insert({
          name: lot.name,
          type: lot.type,
          address: lot.address,
          lat: lot.lat,
          lng: lot.lng,
          market_id: marketId,
          is_active: true
        });
      
      if (!error) {
        stats.storageLots.inserted++;
      }
    }
    
    console.log(`✅ Storage Lots: ${stats.storageLots.inserted} inserted, ${stats.storageLots.skipped} skipped`);
  } catch (error) {
    console.error('❌ Error seeding storage lots:', error);
  }
}

/**
 * Seed Located Vehicles
 */
async function seedVehicles() {
  console.log('\n🚗 Seeding Vehicles...');
  
  try {
    const filePath = path.join(process.cwd(), 'public/data/located-vehicles.csv');
    const data = parseCSV(filePath);
    
    // Get all clients, markets, zones for mapping
    const { data: clients } = await supabase.from('clients').select('id, code, name');
    const { data: markets } = await supabase.from('markets').select('id, name');
    const { data: zones } = await supabase.from('zones').select('id, code, name');
    
    const clientMap = new Map(clients?.map(c => [c.name.toLowerCase(), c.id]) || []);
    const marketMap = new Map(markets?.map(m => [m.name.toLowerCase(), m.id]) || []);
    
    // Batch insert vehicles (100 at a time)
    const BATCH_SIZE = 100;
    const vehicles = [];
    
    for (const row of data) {
      // Skip header rows and invalid data
      if (!row.VIN && !row.vin && !row.TAG && !row.tag) continue;
      if (row.TYPE === 'TYPE' || row.CLIENT === 'CLIENT') continue;
      
      const vin = row.VIN || row.vin || '';
      const clientName = (row.CLIENT || row.client || '').trim();
      const clientId = clientMap.get(clientName.toLowerCase());
      
      // Determine market
      const city = (row.CITY || row.city || '').trim();
      const marketName = city.includes('DC') ? 'Washington' : 
                        city.includes('Baltimore') ? 'Maryland' : 'Maryland';
      const marketId = marketMap.get(marketName.toLowerCase()) || markets?.[0]?.id;
      
      // Parse coordinates
      const notes = row.NOTES || row.notes || '';
      const coords = extractCoordinates(notes);
      
      // Determine status
      let status = 'Located' as const;
      if (row.TYPE?.includes('BLOCK')) status = 'Blocked';
      if (row.TYPE?.includes('STASH')) status = 'Stashed';
      
      // Build address
      const street = row.STREET || row.Street || '';
      const address = [street, city, row.ZIP || row.Zip].filter(Boolean).join(', ');
      
      vehicles.push({
        vin: vin || null,
        plate: row.TAG || row.tag || null,
        year: row.YEAR || row.year ? parseInt(row.YEAR || row.year) : null,
        make: row.MAKE || row.make || null,
        model: row.MODEL || row.model || null,
        color: row.COLOR || row.color || null,
        address: address || null,
        lat: coords?.lat || null,
        lng: coords?.lng || null,
        city: city || null,
        zip: row.ZIP || row.Zip || null,
        client_id: clientId || null,
        market_id: marketId || null,
        zone_id: null, // Will be set later if needed
        status,
        source: row.DRIVER || row.driver || null,
        notes: notes ? [notes] : []
      });
      
      if (vehicles.length >= BATCH_SIZE) {
        const { error } = await supabase
          .from('located_vehicles')
          .upsert(vehicles, { onConflict: 'vin', ignoreDuplicates: false });
        
        if (!error) {
          stats.vehicles.inserted += vehicles.length;
        }
        vehicles.length = 0;
      }
    }
    
    // Insert remaining
    if (vehicles.length > 0) {
      const { error } = await supabase
        .from('located_vehicles')
        .upsert(vehicles, { onConflict: 'vin', ignoreDuplicates: false });
      
      if (!error) {
        stats.vehicles.inserted += vehicles.length;
      }
    }
    
    console.log(`✅ Vehicles: ${stats.vehicles.inserted} inserted`);
  } catch (error) {
    console.error('❌ Error seeding vehicles:', error);
  }
}

/**
 * Main seeding function
 */
async function main() {
  console.log('🌱 Starting database seeding...');
  console.log(`📦 Supabase URL: ${supabaseUrl}`);
  
  // Seed in order
  await seedMarketsAndZones();
  await seedClients();
  await seedStorageLots();
  await seedVehicles();
  
  // Print summary
  console.log('\n📊 Seeding Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Markets:       +${stats.markets.inserted} | ~${stats.markets.skipped}`);
  console.log(`Zones:         +${stats.zones.inserted} | ~${stats.zones.skipped}`);
  console.log(`Clients:       +${stats.clients.inserted} | ~${stats.clients.skipped}`);
  console.log(`Storage Lots:  +${stats.storageLots.inserted} | ~${stats.storageLots.skipped}`);
  console.log(`Vehicles:      +${stats.vehicles.inserted}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n✅ Seeding complete!');
}

// Run the seeding
main().catch(console.error);

