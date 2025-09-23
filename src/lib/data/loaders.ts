/**
 * Data Loaders for Real CSV Data
 * 
 * Loads and transforms located vehicle data from CSV files.
 */

import { parseCsv } from '../csv';
import { isLatLon, sanitizeText, toTitleCase } from '../validate';
import type { LocatedRow, ParseReport } from '@/types/dashboard';

// Re-export types from types/dashboard.ts for backward compatibility
export type { LocatedRow, ParseReport } from '@/types/dashboard';

/**
 * Flexible header mapping for CSV columns
 * Handles common variations in column names
 */
function mapToLocatedRow(row: Record<string, string>): LocatedRow | null {
  try {
    // Extract coordinates from NOTES field (format: "lat, lon")
    const notesField = sanitizeText(row.NOTES || row.notes || '');
    const coords = parseCoordinates(notesField);
    
    // Validate coordinates - this is critical for data quality
    if (!coords || !isLatLon(coords.lat, coords.lon)) {
      return null; // Drop invalid coordinates
    }
    
    // Build address from street, city, zip
    const street = sanitizeText(row.STREET || row.Street || row.address || '');
    const city = sanitizeText(row.CITY || row.City || row.city || '');
    const zip = sanitizeText(row.ZIP || row.Zip || row.zip || '');
    const address = [street, city, zip].filter(Boolean).join(', ');
    
    // Sanitize and validate required fields
    const client = sanitizeText(row.CLIENT || row.client || row.Client || '');
    const type = sanitizeText(row.TYPE || row.type || '');
    const vin = sanitizeText(row.VIN || row.vin || '');
    
    if (!client || client === 'Unknown' || !type || !vin) {
      return null; // Drop rows without essential data
    }
    
    // Determine market based on location
    const market = determineMarket(city, client);
    
    // Determine zone based on city/region
    const zone = determineZone(city, market);
    
    // Map status based on driver field and other indicators
    const status = determineStatus(row.DRIVER || row.driver || '', type);
    
    return {
      id: row.ID || vin || row.TAG || row.tag || `row_${Math.random().toString(36).substr(2, 9)}`,
      status,
      market: toTitleCase(market),
      client: toTitleCase(client),
      zone: toTitleCase(zone),
      address: address || `${coords.lat}, ${coords.lon}`,
      lat: coords.lat,
      lon: coords.lon,
      driver: sanitizeText(row.SPOTTER || row.Spotter || row.DRIVER || row.driver || '') || undefined,
      locatedAt: undefined, // No date in clean CSV
      year: sanitizeText(row.YEAR || row.year || '') || undefined,
      make: sanitizeText(row.MAKE || row.make || '') || undefined,
      model: sanitizeText(row.MODEL || row.model || '') || undefined,
      color: sanitizeText(row.COLOR || row.color || '') || undefined,
      tag: sanitizeText(row.TAG || row.tag || '') || undefined,
      vin,
      city: sanitizeText(city) || undefined,
      zip: sanitizeText(zip) || undefined,
      notes: notesField || undefined,
    };
  } catch (error) {
    console.warn('Error mapping row:', row, error);
    return null;
  }
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
      
      // Basic validation - check if coordinates are reasonable (US coordinates roughly)
      if (lat >= 25 && lat <= 50 && lon >= -130 && lon <= -65) {
        return { lat, lon };
      }
    }
  }
  
  console.warn('Could not parse coordinates from:', gpsField);
  return null;
}

/**
 * Determine market based on city and client
 */
function determineMarket(city: string, client: string): string {
  const cityLower = city.toLowerCase();
  const clientLower = client.toLowerCase();
  
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
  if (clientLower.includes('dallas')) return 'Dallas';
  if (clientLower.includes('maryland')) return 'Maryland';
  
  // Default to Maryland for most clients in the CSV
  return 'Maryland';
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
 * Load located vehicles from CSV with validation and parse reporting
 */
export async function loadLocated(): Promise<{ data: LocatedRow[]; report: ParseReport }> {
  try {
    const res = await fetch('/data/located-vehicles-clean.csv', { 
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
    
    // Initialize parse report
    const report: ParseReport = {
      total: rows.length,
      valid: 0,
      dropped: 0,
      reasonCounts: {}
    };
    
    // Filter out empty rows first
    const validRows = rows.filter(row => {
      // Skip rows without essential data
      const hasClient = row.CLIENT && row.CLIENT.trim() !== '';
      const hasType = row.TYPE && row.TYPE.trim() !== '';
      const hasVIN = row.VIN && row.VIN.trim() !== '';
      
      if (!hasClient || !hasType || !hasVIN) {
        report.dropped++;
        report.reasonCounts['missing_required_fields'] = (report.reasonCounts['missing_required_fields'] || 0) + 1;
        return false;
      }
      
      return true;
    });
    
    console.log('Valid rows after filtering:', validRows.length);
    
    // Map and validate rows
    const locatedRows: LocatedRow[] = [];
    
    for (const row of validRows) {
      const mappedRow = mapToLocatedRow(row);
      
      if (mappedRow) {
        locatedRows.push(mappedRow);
        report.valid++;
      } else {
        report.dropped++;
        report.reasonCounts['invalid_coordinates'] = (report.reasonCounts['invalid_coordinates'] || 0) + 1;
      }
    }
    
    report.reasonCounts['successfully_parsed'] = report.valid;
    
    console.log('Parse report:', report);
    console.log('Final located rows:', locatedRows.length);
    
    return { data: locatedRows, report };
  } catch (error) {
    console.error('Error loading located vehicles:', error);
    return { 
      data: [], 
      report: { 
        total: 0, 
        valid: 0, 
        dropped: 0, 
        reasonCounts: { error: 1 } 
      } 
    };
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
