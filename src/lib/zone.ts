/**
 * Zone mapping utility for geographic areas
 * Maps city names to standardized zone names
 */

export function toZone(cityRaw?: string): string {
  if (!cityRaw) return 'Maryland-Other';
  
  const c = cityRaw.toUpperCase().trim();
  
  // Baltimore area
  if (c.includes('BALTIMORE')) return 'Maryland-Baltimore';
  
  // Washington DC area
  if (c === 'DC' || c.includes('WASHINGTON')) return 'DC-Metro';
  
  // Annapolis area
  if (c.includes('ANNAPOLIS')) return 'Maryland-Annapolis';
  
  // Columbia area
  if (c.includes('COLUMBIA')) return 'Maryland-Columbia';
  
  // Default to Maryland-Other for all other Maryland locations
  return 'Maryland-Other';
}

/**
 * Get all available zones
 */
export function getAllZones(): string[] {
  return [
    'Maryland-Baltimore',
    'DC-Metro', 
    'Maryland-Annapolis',
    'Maryland-Columbia',
    'Maryland-Other'
  ];
}

/**
 * Check if a zone is valid
 */
export function isValidZone(zone: string): boolean {
  return getAllZones().includes(zone);
}
