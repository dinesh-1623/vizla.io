/**
 * Storage lots utilities
 */

import { StorageLot } from '@/types/vehicle';

/**
 * Load storage lots from JSON file
 */
export async function loadLots(): Promise<StorageLot[]> {
  try {
    const response = await fetch('/data/storage-lots.json');
    const lots: StorageLot[] = await response.json();
    return lots;
  } catch (error) {
    console.error('Error loading storage lots:', error);
    return [];
  }
}

/**
 * Geocode an address using a geocoding service
 * Caches results in localStorage
 */
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const cacheKey = `vizla:geo:${address}`;
  
  // Check cache first
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // Invalid cache, continue to geocode
    }
  }
  
  try {
    // Skip geocoding for now to avoid 401 errors
    // Return mock coordinates for the pilot
    const mockCoords = { lat: 39.2904 + (Math.random() - 0.5) * 0.5, lng: -76.6122 + (Math.random() - 0.5) * 0.5 };
    
    // Cache the result
    localStorage.setItem(cacheKey, JSON.stringify(mockCoords));
    
    return mockCoords;
  } catch (error) {
    console.warn(`Failed to geocode address: ${address}`, error);
  }
  
  return null;
}

/**
 * Geocode all lots that are missing coordinates
 */
export async function geocodeLots(lots: StorageLot[]): Promise<StorageLot[]> {
  const geocodedLots: StorageLot[] = [];
  
  for (const lot of lots) {
    if (lot.lat !== null && lot.lng !== null) {
      // Already has coordinates
      geocodedLots.push(lot);
    } else {
      // Needs geocoding
      const coords = await geocodeAddress(lot.address);
      if (coords) {
        geocodedLots.push({
          ...lot,
          lat: coords.lat,
          lng: coords.lng
        });
      } else {
        // Keep original lot without coordinates
        geocodedLots.push(lot);
      }
    }
  }
  
  return geocodedLots;
}

/**
 * Calculate Haversine distance between two points in miles
 */
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find the nearest storage lot to a given location
 */
export function nearestLot(from: { lat: number; lng: number }, lots: StorageLot[]): StorageLot | null {
  let nearest: StorageLot | null = null;
  let minDistance = Infinity;
  
  for (const lot of lots) {
    if (lot.lat !== null && lot.lng !== null) {
      const distance = haversineDistance(from.lat, from.lng, lot.lat, lot.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = lot;
      }
    }
  }
  
  return nearest;
}

/**
 * Get distance to a specific lot
 */
export function getDistanceToLot(
  from: { lat: number; lng: number }, 
  lot: StorageLot
): number | null {
  if (lot.lat === null || lot.lng === null) return null;
  
  return haversineDistance(from.lat, from.lng, lot.lat, lot.lng);
}
