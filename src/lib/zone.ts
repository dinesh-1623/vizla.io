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
 * Storage lots for Google Maps routing
 */
export const STORAGE_LOTS = [
  '11051 Pulaski Hwy, White Marsh, MD 21162',
  '12 Peoples Dr, Newark, DE 19702',
  '2507 Bladensburg Road NE, Washington, DC 20018',
  '4221 Curtis Ave, Baltimore, MD 21226',
  '5090 Mountville Road, Fredrick, MD 21703',
  '700 West Sunset Ave., Greensboro, MD 21639',
  '7908 Bellefonte Lane, Clinton, MD 20735',
  '8595 Dorsey Run Road, Annapolis Junction, MD 20701',
] as const;

/**
 * Pick nearest storage lot based on city
 */
export function pickNearestLot(cityRaw?: string): string {
  if (!cityRaw) return STORAGE_LOTS[0]; // Default to first lot
  
  const c = cityRaw.toUpperCase();
  
  if (c.includes('BALTIMORE')) return '4221 Curtis Ave, Baltimore, MD 21226';
  if (c.includes('WASHINGTON') || c === 'DC') return '2507 Bladensburg Road NE, Washington, DC 20018';
  if (c.includes('FREDERICK')) return '5090 Mountville Road, Fredrick, MD 21703';
  if (c.includes('CLINTON')) return '7908 Bellefonte Lane, Clinton, MD 20735';
  if (c.includes('ANNAPOLIS')) return '8595 Dorsey Run Road, Annapolis Junction, MD 20701';
  if (c.includes('WHITE MARSH')) return '11051 Pulaski Hwy, White Marsh, MD 21162';
  if (c.includes('NEWARK')) return '12 Peoples Dr, Newark, DE 19702';
  if (c.includes('GREENSBORO')) return '700 West Sunset Ave., Greensboro, MD 21639';
  
  return STORAGE_LOTS[0]; // Default fallback
}

/**
 * Build Google Maps directions URL
 */
export function buildDirectionsUrl(originLot: string, vehicleAddr: string, returnLot: string): string {
  const o = encodeURIComponent(originLot);
  const d = encodeURIComponent(returnLot);
  const w = encodeURIComponent(vehicleAddr);
  return `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${d}&waypoints=${w}`;
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
