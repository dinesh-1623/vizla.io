import { LocatedRow, CsvRecord } from '@/lib/types/located';
import { parse, format, isValid } from 'date-fns';

/**
 * City to market mapping
 */
const CITY_TO_MARKET_MAP: Record<string, string> = {
  'BALTIMORE': 'Maryland-Baltimore',
  'ANNAPOLIS': 'Maryland-Annapolis',
  'COLUMBIA': 'Maryland-Columbia',
  'SILVER SPRING': 'Maryland-Silver Spring',
  'ROCKVILLE': 'Maryland-Rockville',
  'GAITHERSBURG': 'Maryland-Gaithersburg',
  'FREDERICK': 'Maryland-Frederick',
  'WALDORF': 'Maryland-Waldorf',
  'LAUREL': 'Maryland-Laurel',
  'BOWIE': 'Maryland-Bowie',
  'WHEATON': 'Maryland-Wheaton',
  'GERMANTOWN': 'Maryland-Germantown',
  'ELKTON': 'Maryland-Elkton',
  'HAVRE DE GRACE': 'Maryland-Havre de Grace',
  'ABERDEEN': 'Maryland-Aberdeen',
};

/**
 * Normalize driver string to standard values
 */
export function normalizeDriver(driver: string): string {
  if (!driver) return 'Unassigned';
  
  const normalized = driver.trim().toUpperCase();
  
  // Map common variations to standard values
  if (normalized.includes('GPS') || normalized.includes('G.P.S')) {
    return 'Gps';
  }
  if (normalized.includes('ROTOR') || normalized.includes('ROTORS')) {
    return 'Rotors';
  }
  if (normalized.includes('IMP') || normalized.includes('IMPOUND')) {
    return 'Imp';
  }
  if (normalized.includes('FUEL') || normalized.includes('FUELING')) {
    return 'Fuel';
  }
  if (normalized === '-' || normalized === '' || normalized.includes('UNASSIGNED') || normalized.includes('NONE')) {
    return 'Unassigned';
  }
  
  // Default to original value if no match
  return driver.trim();
}

/**
 * Map city to market
 */
export function cityToMarket(city: string): string {
  if (!city) return 'Maryland-Other';
  
  const normalizedCity = city.trim().toUpperCase();
  return CITY_TO_MARKET_MAP[normalizedCity] || 'Maryland-Other';
}

/**
 * Map city to zone (simple bucketing)
 */
export function cityToZone(city: string): string {
  if (!city) return 'Other';
  
  const normalizedCity = city.trim().toUpperCase();
  
  // Check if it's a major city with known zones
  if (normalizedCity === 'BALTIMORE') {
    return 'Baltimore Metro';
  }
  if (normalizedCity === 'ANNAPOLIS') {
    return 'Annapolis Area';
  }
  if (normalizedCity === 'COLUMBIA') {
    return 'Columbia Area';
  }
  
  // Check for directional indicators
  if (normalizedCity.includes('NORTH') || normalizedCity.includes('N ')) {
    return 'North Zone';
  }
  if (normalizedCity.includes('SOUTH') || normalizedCity.includes('S ')) {
    return 'South Zone';
  }
  if (normalizedCity.includes('EAST') || normalizedCity.includes('E ')) {
    return 'East Zone';
  }
  if (normalizedCity.includes('WEST') || normalizedCity.includes('W ')) {
    return 'West Zone';
  }
  
  return 'Other';
}

/**
 * Derive status from record data
 */
export function deriveStatus(record: CsvRecord): 'Located' | 'Blocked' | 'Stashed' {
  const notes = (record.NOTES || record.notes || '').toUpperCase();
  const location = (record.LOCATION || record.location || '').toUpperCase();
  const status = (record.STATUS || record.status || '').toUpperCase();
  
  // Check for stashed indicators
  if (notes.includes('STASH') || notes.includes('IMPOUND') || 
      notes.includes('GARAGE') || notes.includes('SECURED') ||
      location.includes('STASH') || location.includes('IMPOUND') ||
      location.includes('GARAGE') || location.includes('SECURED') ||
      status === 'STASHED') {
    return 'Stashed';
  }
  
  // Check for blocked indicators
  if (notes.includes('BLOCKED') || notes.includes('NOT HERE') || 
      notes.includes('SLEEP MODE') || notes.includes('READ RDN') ||
      notes.includes('NO ACCESS') || notes.includes('BLOCKING') ||
      status === 'BLOCKED') {
    return 'Blocked';
  }
  
  // Default to located
  return 'Located';
}

/**
 * Parse date from various formats
 */
function parseLocatedDate(dateStr: string): string | undefined {
  if (!dateStr || dateStr.trim() === '') return undefined;
  
  const trimmed = dateStr.trim();
  
  // Try different date formats
  const formats = [
    'M/d/yy',           // 9/22/25
    'M/d/yyyy',         // 9/22/2025
    'MM/dd/yy',         // 09/22/25
    'MM/dd/yyyy',       // 09/22/2025
    'yyyy-MM-dd',       // 2025-09-22
    'M/d/yy HH:mm',     // 9/22/25 14:05
    'M/d/yyyy HH:mm',   // 9/22/2025 14:05
    'MM/dd/yy HH:mm',   // 09/22/25 14:05
    'MM/dd/yyyy HH:mm', // 09/22/2025 14:05
  ];
  
  for (const formatStr of formats) {
    try {
      const parsed = parse(trimmed, formatStr, new Date());
      if (isValid(parsed)) {
        return parsed.toISOString();
      }
    } catch (error) {
      // Continue to next format
    }
  }
  
  // Try native Date parsing as fallback
  try {
    const parsed = new Date(trimmed);
    if (isValid(parsed)) {
      return parsed.toISOString();
    }
  } catch (error) {
    // Ignore parsing errors
  }
  
  return undefined;
}

/**
 * Check if row has a valid date
 */
export function hasDate(row: LocatedRow): boolean {
  return !!(row.locatedAt && !row._missingDate);
}

/**
 * Check if row is within date range
 */
export function isWithinRange(row: LocatedRow, from: string, to: string): boolean {
  if (!row.locatedAt || row._missingDate) return false;
  
  const rowDate = new Date(row.locatedAt);
  const fromDate = new Date(from);
  const toDate = new Date(to);
  
  return rowDate >= fromDate && rowDate <= toDate;
}

/**
 * Convert CSV record to LocatedRow with normalization
 */
export function fromCsvRecord(record: CsvRecord): LocatedRow {
  // Helper to safely get and trim string values
  const getString = (key: string, defaultValue = ''): string => {
    const value = record[key] || record[key.toLowerCase()] || defaultValue;
    return typeof value === 'string' ? value.trim() : defaultValue;
  };

  // Extract and normalize fields
  const client = getString('CLIENT', getString('BANK', 'Unknown Client'));
  const city = getString('CITY', '');
  const driver = normalizeDriver(getString('DRIVER', getString('DRIVER NAME', '')));
  const status = deriveStatus(record);
  
  // Use explicit zone if available, otherwise derive from city
  const explicitZone = getString('ZONE', '');
  const zone = explicitZone || cityToZone(city);
  
  // Parse date from various column names
  const dateStr = getString('LOCATED DATE', getString('Located', getString('Last Ping', getString('DATE', getString('UPDATED', '')))));
  const locatedAt = parseLocatedDate(dateStr);

  // Parse coordinates if available
  const latStr = getString('LAT', getString('LATITUDE', ''));
  const lngStr = getString('LNG', getString('LONGITUDE', getString('LON', '')));
  const lat = latStr ? parseFloat(latStr) : undefined;
  const lng = lngStr ? parseFloat(lngStr) : undefined;

  // Build address from available fields
  const streetField = getString('STREET', getString('ADDRESS', ''));
  const addressParts = [];
  if (streetField) addressParts.push(streetField);
  if (city) addressParts.push(city);
  const address = addressParts.length > 0 ? addressParts.join(', ') : undefined;

  const missingDate = !locatedAt;

  return {
    client,
    market: cityToMarket(city),
    zone,
    driver,
    status,
    locatedAt,
    vin: getString('VIN', undefined),
    tag: getString('TAG', undefined),
    color: getString('COLOR', undefined),
    makeModel: getString('MAKE MODEL', getString('MAKE', undefined)),
    street: streetField || undefined,
    city: city || undefined,
    lat,
    lng,
    address,
    _missingDate: missingDate,
  };
}
