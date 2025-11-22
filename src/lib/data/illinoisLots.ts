/**
 * Illinois Storage Lots Configuration
 * 
 * Three storage lot locations in Illinois for Chicago area operations
 */

export interface StorageLot {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  zip: string;
  city: string;
  state: string;
}

export const ILLINOIS_LOTS: StorageLot[] = [
  {
    id: 'calumet-park',
    name: 'Calumet Park Lot',
    address: '12109 Paulina St, Calumet Park, IL 60827',
    lat: 41.6667,
    lng: -87.6583,
    zip: '60827',
    city: 'Calumet Park',
    state: 'IL'
  },
  {
    id: 'melrose-park',
    name: 'Melrose Park Lot',
    address: '4699 W Lake St, Melrose Park, IL 60160',
    lat: 41.9000,
    lng: -87.8500,
    zip: '60160',
    city: 'Melrose Park',
    state: 'IL'
  },
  {
    id: 'joliet',
    name: 'Joliet Lot',
    address: '827 Gardner St, Joliet, IL 60433',
    lat: 41.5250,
    lng: -88.0817,
    zip: '60433',
    city: 'Joliet',
    state: 'IL'
  }
];

/**
 * Default lot (first one) - used as fallback
 */
export const DEFAULT_LOT = ILLINOIS_LOTS[0];

/**
 * Get lot by ID
 */
export function getLotById(id: string): StorageLot | undefined {
  return ILLINOIS_LOTS.find(lot => lot.id === id);
}

/**
 * Get lot by address
 */
export function getLotByAddress(address: string): StorageLot | undefined {
  return ILLINOIS_LOTS.find(lot => lot.address === address);
}

/**
 * Find nearest lot using Haversine distance (fast approximation)
 * For production, use Google Maps Distance Matrix API for accurate travel times
 */
export function findNearestLotByDistance(
  lat: number,
  lng: number
): StorageLot {
  let nearestLot = ILLINOIS_LOTS[0];
  let minDistance = Infinity;

  for (const lot of ILLINOIS_LOTS) {
    const distance = haversineDistance(lat, lng, lot.lat, lot.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearestLot = lot;
    }
  }

  return nearestLot;
}

/**
 * Haversine distance calculation (miles)
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

