/**
 * Baltimore Data Loader
 * 
 * Converts TowCard data from Tow Driver View to LocatedRow format for Dashboard
 */

import { TOW_CARDS, type TowCard } from '@/app/tow-driver/data/baltimoreRun';
import { LocatedRow, Status } from '../types';

/**
 * Convert TowCard to LocatedRow format for dashboard compatibility
 */
function towCardToLocatedRow(card: TowCard): LocatedRow {
  // Extract coordinates from fullAddress if available
  const coords = parseCoordinatesFromAddress(card.fullAddress);
  
  // Determine market (all Baltimore data)
  const market = 'Maryland';
  
  // Determine zone based on city
  const zone = determineZoneFromCity(card.city);
  
  // Determine status based on client and location
  const status = determineStatusFromClient(card.client);
  
  // Use source as driver for backward compatibility
  const source = 'GPS'; // All Baltimore data is GPS-based
  const driver = card.client; // Use client as driver for now
  
  // Generate assigned driver based on client
  const assignedDriver = generateAssignedDriver(card.client);
  
  return {
    id: card.id,
    status,
    market,
    client: card.client,
    zone,
    address: card.fullAddress,
    lat: coords?.lat || 0,
    lon: coords?.lng || 0,
    driver,
    source,
    assignedDriver,
    locatedAt: new Date().toISOString(), // Current time as located date
    year: card.year.toString(),
    make: card.make,
    model: card.model,
    color: card.color,
    tag: card.plate,
    vin: card.vin,
    city: card.city,
    zip: card.zip,
    notes: `Generated from Tow Driver data - Client: ${card.client}`,
  };
}

/**
 * Parse coordinates from address string
 */
function parseCoordinatesFromAddress(address: string): { lat: number; lng: number } | null {
  // Check if address contains coordinates (format: "lat, lng")
  const coordMatch = address.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
  
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    
    // Basic validation - check if coordinates are reasonable (Baltimore area)
    if (lat >= 39 && lat <= 40 && lng >= -77 && lng <= -76) {
      return { lat, lng };
    }
  }
  
  return null;
}

/**
 * Determine zone based on city
 */
function determineZoneFromCity(city: string): string {
  const cityLower = city.toLowerCase();
  
  if (cityLower.includes('baltimore')) {
    return 'Maryland-Baltimore';
  }
  if (cityLower.includes('arbutus') || cityLower.includes('halethorpe')) {
    return 'Maryland-Baltimore-South';
  }
  if (cityLower.includes('annapolis')) {
    return 'Maryland-Annapolis';
  }
  if (cityLower.includes('columbia')) {
    return 'Maryland-Columbia';
  }
  if (cityLower.includes('glen burnie') || cityLower.includes('croom')) {
    return 'Maryland-Baltimore-East';
  }
  
  return 'Maryland-Baltimore';
}

/**
 * Determine status based on client
 */
function determineStatusFromClient(client: string): Status {
  const clientLower = client.toLowerCase();
  
  // Some clients might indicate blocked or stashed status
  if (clientLower.includes('blocked') || clientLower.includes('impound')) {
    return 'Blocked';
  }
  
  if (clientLower.includes('stash') || clientLower.includes('stored')) {
    return 'Stashed';
  }
  
  // Default to Located for all Baltimore data
  return 'Located';
}

/**
 * Generate assigned driver based on client
 */
function generateAssignedDriver(client: string): string {
  // Map clients to realistic driver names
  const driverMap: Record<string, string> = {
    'PK': 'Mike Rodriguez',
    'First Commonwealth': 'Sarah Johnson',
    'Capital One': 'David Chen',
    'MV': 'Lisa Thompson',
    'GM': 'Robert Martinez',
    'United Bank': 'Jennifer Davis',
    'Automotive Fleet': 'Michael Brown',
    'Primeritus': 'Amanda Wilson',
    'PK Willis': 'James Anderson',
    'Summs Skip': 'Maria Garcia',
    'Bridgecrest': 'Kevin Lee',
    'LPS': 'Rachel White',
    'Advanced Alert': 'Christopher Taylor',
    'PAR': 'Michelle Clark'
  };
  
  return driverMap[client] || 'Unassigned';
}

/**
 * Load Baltimore data as LocatedRow array
 */
export async function loadBaltimoreData(): Promise<LocatedRow[]> {
  try {
    console.log('🔄 Loading Baltimore data from Tow Driver dataset...');
    
    // Convert all TowCard data to LocatedRow format
    const locatedRows = TOW_CARDS.map(towCardToLocatedRow);
    
    console.log('📊 Baltimore data loaded:', {
      total: locatedRows.length,
      clients: [...new Set(locatedRows.map(r => r.client))].length,
      zones: [...new Set(locatedRows.map(r => r.zone))].length,
      statuses: [...new Set(locatedRows.map(r => r.status))]
    });
    
    return locatedRows;
  } catch (error) {
    console.error('❌ Error loading Baltimore data:', error);
    return [];
  }
}

/**
 * Get unique values for Baltimore data
 */
export function getBaltimoreUniqueValues(rows: LocatedRow[]) {
  return {
    markets: [...new Set(rows.map(r => r.market))].sort(),
    statuses: [...new Set(rows.map(r => r.status))].sort(),
    clients: [...new Set(rows.map(r => r.client))].sort(),
    zones: [...new Set(rows.map(r => r.zone))].sort(),
    drivers: [...new Set(rows.map(r => r.assignedDriver).filter(Boolean))].sort(),
  };
}
