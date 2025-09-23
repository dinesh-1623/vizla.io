import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert string to Title Case
 */
export function toTitleCase(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format percentage with one decimal place
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Calculate Haversine distance between two points
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Find nearest storage lot to a given location
 */
export function findNearestStorageLot(lat: number, lon: number, storageLots: Array<{lat: number; lng: number; [key: string]: any}>): any | null {
  if (storageLots.length === 0) return null;
  
  let nearest = storageLots[0];
  let minDistance = haversineDistance(lat, lon, nearest.lat, nearest.lng);
  
  for (let i = 1; i < storageLots.length; i++) {
    const lot = storageLots[i];
    const distance = haversineDistance(lat, lon, lot.lat, lot.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = lot;
    }
  }
  
  return nearest;
}

/**
 * Build Google Maps URL with storage lot origin
 */
export function buildGoogleMapsUrl(
  destination: { lat?: number; lng?: number; address?: string },
  storageLots: Array<{lat: number; lng: number; [key: string]: any}> = []
): string {
  if (!destination.lat && !destination.lng && !destination.address) {
    return '#';
  }
  
  const baseUrl = 'https://www.google.com/maps/dir/?api=1';
  const params = new URLSearchParams();
  
  // Set destination
  const dest = destination.lat && destination.lng 
    ? `${destination.lat},${destination.lng}`
    : destination.address || '';
  
  if (dest) {
    params.set('destination', encodeURIComponent(dest));
  }
  
  // Set origin from nearest storage lot if we have coordinates
  if (destination.lat && destination.lng) {
    const nearestLot = findNearestStorageLot(destination.lat, destination.lng, storageLots);
    if (nearestLot) {
      params.set('origin', encodeURIComponent(`${nearestLot.lat},${nearestLot.lng}`));
    }
  }
  
  params.set('travelmode', 'driving');
  
  return `${baseUrl}&${params.toString()}`;
}

/**
 * Load global filters from localStorage
 */
export function loadGlobalFilters(): { market: string; status: string } {
  try {
    const market = localStorage.getItem('vizla.market') || 'All Markets';
    const status = localStorage.getItem('vizla.status') || 'All Statuses';
    return { market, status };
  } catch {
    return { market: 'All Markets', status: 'All Statuses' };
  }
}

/**
 * Save global filters to localStorage
 */
export function saveGlobalFilters(market: string, status: string): void {
  try {
    localStorage.setItem('vizla.market', market);
    localStorage.setItem('vizla.status', status);
  } catch {
    // Ignore localStorage errors
  }
}