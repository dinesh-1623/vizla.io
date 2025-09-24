import { LocatedRow, CsvRecord } from '@/lib/types/located';

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
  
  return {
    client,
    market: cityToMarket(city),
    zone,
    driver,
    status,
    vin: getString('VIN', undefined),
    tag: getString('TAG', undefined),
    color: getString('COLOR', undefined),
    makeModel: getString('MAKE MODEL', getString('MAKE', undefined)),
    street: getString('STREET', getString('ADDRESS', undefined)),
    city: city || undefined,
  };
}
