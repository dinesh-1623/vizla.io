/**
 * Data Loaders for Real CSV Data
 * 
 * Loads and transforms located vehicle data from CSV files.
 */

import { parseCsv } from '../csv';

export type LocatedRow = {
  id: string;
  status: 'located' | 'blocked' | 'stashed';
  market: string;        // Dallas, Maryland, etc.
  client: string;
  zone: string;          // Dallas-North/East/South/West
  address: string;
  lat: number;
  lon: number;
  driver?: string;       // spotter/assigned
  locatedAt?: string;    // ISO or parseable date
  year?: string;
  make?: string;
  model?: string;
  color?: string;
  tag?: string;
  vin?: string;
  city?: string;
  zip?: string;
  notes?: string;
};

/**
 * Flexible header mapping for CSV columns
 * Handles common variations in column names
 */
function mapToLocatedRow(row: Record<string, string>): LocatedRow {
  // Extract coordinates from NOTES field (format: "lat, lon date")
  // The GPS field contains "GPS" or "BANK", coordinates are in NOTES
  const notesField = row.NOTES || row.notes || '';
  const coords = parseCoordinates(notesField);
  
  // Extract date from notes field if present
  const dateMatch = notesField.match(/(\d{1,2}\/\d{1,2})/);
  const locatedDate = dateMatch ? dateMatch[1] : undefined;
  
  // Build address from street, city, zip
  const street = row.STREET || row.Street || row.address || '';
  const city = row.CITY || row.City || row.city || '';
  const zip = row.ZIP || row.Zip || row.zip || '';
  const address = [street, city, zip].filter(Boolean).join(', ');
  
  // Determine market based on location
  const market = determineMarket(city, row.CLIENT || row.client || '');
  
  // Determine zone based on city/region
  const zone = determineZone(city, market);
  
  // Map status based on driver field and other indicators
  const status = determineStatus(row.DRIVER || row.driver || '', row.TYPE || row.type || '');
  
  return {
    id: row.VIN || row.vin || row.TAG || row.tag || `row_${Math.random().toString(36).substr(2, 9)}`,
    status,
    market,
    client: row.CLIENT || row.client || row.Client || 'Unknown',
    zone,
    address: address || coords ? `${coords.lat}, ${coords.lon}` : 'Unknown Location',
    lat: coords.lat || 0,
    lon: coords.lon || 0,
    driver: row.SPOTTER || row.Spotter || row.DRIVER || row.driver || undefined,
    locatedAt: locatedDate,
    year: row.YEAR || row.year || undefined,
    make: row.MAKE || row.make || undefined,
    model: row.MODEL || row.model || undefined,
    color: row.COLOR || row.color || undefined,
    tag: row.TAG || row.tag || undefined,
    vin: row.VIN || row.vin || undefined,
    city: city || undefined,
    zip: zip || undefined,
    notes: row.NOTES || row.notes || undefined,
  };
}

/**
 * Parse coordinates from GPS field
 * Handles formats like: "38.56498, -77.00248    8/18" or "39.325345, -76.45749"
 */
function parseCoordinates(gpsField: string): { lat: number; lon: number } | null {
  if (!gpsField || gpsField.trim() === '') return null;
  
  // Try multiple patterns to extract coordinates
  const patterns = [
    // Pattern 1: "38.56498, -77.00248    8/18"
    /(-?\d+\.?\d*),\s*(-?\d+\.?\d*)\s*\d+\/\d+/,
    // Pattern 2: "39.325345, -76.45749"
    /(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/,
    // Pattern 3: "38.56498,-77.00248" (no spaces)
    /(-?\d+\.?\d*),(-?\d+\.?\d*)/,
  ];
  
  for (const pattern of patterns) {
    const match = gpsField.match(pattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      
      // Basic validation - check if coordinates are reasonable
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        return { lat, lon };
      }
    }
  }
  
  return null;
}

/**
 * Determine market based on city and client
 */
function determineMarket(city: string, client: string): string {
  const cityLower = city.toLowerCase();
  
  if (cityLower.includes('dallas') || cityLower.includes('fort worth') || cityLower.includes('plano')) {
    return 'Dallas';
  }
  if (cityLower.includes('baltimore') || cityLower.includes('annapolis') || cityLower.includes('maryland')) {
    return 'Maryland';
  }
  if (cityLower.includes('dc') || cityLower.includes('washington')) {
    return 'Washington DC';
  }
  if (cityLower.includes('virginia') || cityLower.includes('alexandria') || cityLower.includes('arlington')) {
    return 'Virginia';
  }
  
  // Default based on client if available
  if (client.toLowerCase().includes('dallas')) return 'Dallas';
  if (client.toLowerCase().includes('maryland')) return 'Maryland';
  
  return 'Unknown';
}

/**
 * Determine zone based on city and market
 */
function determineZone(city: string, market: string): string {
  const cityLower = city.toLowerCase();
  
  if (market === 'Dallas') {
    if (cityLower.includes('north') || cityLower.includes('plano') || cityLower.includes('frisco')) {
      return 'Dallas-North';
    }
    if (cityLower.includes('south') || cityLower.includes('mesquite') || cityLower.includes('duncanville')) {
      return 'Dallas-South';
    }
    if (cityLower.includes('east') || cityLower.includes('garland') || cityLower.includes('rowlett')) {
      return 'Dallas-East';
    }
    if (cityLower.includes('west') || cityLower.includes('irving') || cityLower.includes('carrollton')) {
      return 'Dallas-West';
    }
    return 'Dallas-Central';
  }
  
  if (market === 'Maryland') {
    if (cityLower.includes('baltimore')) return 'Maryland-Baltimore';
    if (cityLower.includes('annapolis')) return 'Maryland-Annapolis';
    if (cityLower.includes('columbia')) return 'Maryland-Columbia';
    return 'Maryland-Other';
  }
  
  if (market === 'Washington DC') {
    return 'DC-Metro';
  }
  
  if (market === 'Virginia') {
    return 'Virginia-Metro';
  }
  
  return `${market}-Other`;
}

/**
 * Determine status based on driver field and type
 */
function determineStatus(driver: string, type: string): 'located' | 'blocked' | 'stashed' {
  const driverLower = driver.toLowerCase();
  const typeLower = type.toLowerCase();
  
  if (driverLower.includes('blocked') || driverLower.includes('impound')) {
    return 'blocked';
  }
  
  if (driverLower.includes('stash') || driverLower.includes('stored')) {
    return 'stashed';
  }
  
  // Default to located if we have a driver or it's a GPS type
  if (driver || typeLower === 'gps') {
    return 'located';
  }
  
  return 'located';
}

/**
 * Load located vehicles from CSV
 */
export async function loadLocated(): Promise<LocatedRow[]> {
  try {
    const res = await fetch('/data/located-vehicles.csv', { 
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!res.ok) {
      throw new Error(`Failed to load CSV: ${res.status} ${res.statusText}`);
    }
    
    const text = await res.text();
    const rows = parseCsv(text);
    
    console.log('Raw CSV rows:', rows.length);
    console.log('Sample rows:', rows.slice(0, 3));
    
    // Filter out empty rows and map to LocatedRow format
    const locatedRows = rows
      .filter(row => {
        // Skip rows without essential data
        const hasClient = row.CLIENT && row.CLIENT.trim() !== '';
        const hasType = row.TYPE && row.TYPE.trim() !== '';
        const hasVIN = row.VIN && row.VIN.trim() !== '';
        
        return hasClient && hasType && hasVIN;
      })
      .map(mapToLocatedRow)
      .filter(row => row.id && row.id.trim() !== '' && row.client && row.client !== 'Unknown');
    
    console.log('Processed located rows:', locatedRows.length);
    console.log('Sample processed rows:', locatedRows.slice(0, 3));
    
    return locatedRows;
  } catch (error) {
    console.error('Error loading located vehicles:', error);
    return [];
  }
}

/**
 * Load and filter located vehicles with optional filters
 */
export async function loadLocatedWithFilters(filters: {
  market?: string;
  status?: string;
  client?: string;
  zone?: string;
}): Promise<LocatedRow[]> {
  const allRows = await loadLocated();
  
  return allRows.filter(row => {
    if (filters.market && row.market !== filters.market) return false;
    if (filters.status && row.status !== filters.status) return false;
    if (filters.client && row.client !== filters.client) return false;
    if (filters.zone && row.zone !== filters.zone) return false;
    return true;
  });
}

/**
 * Get unique values for filter dropdowns
 */
export function getUniqueValues(rows: LocatedRow[]) {
  return {
    markets: [...new Set(rows.map(r => r.market))].sort(),
    statuses: [...new Set(rows.map(r => r.status))].sort(),
    clients: [...new Set(rows.map(r => r.client))].sort(),
    zones: [...new Set(rows.map(r => r.zone))].sort(),
    drivers: [...new Set(rows.map(r => r.driver).filter(Boolean))].sort(),
  };
}
