/**
 * Browser-safe geospatial utilities
 * Replaces any Node.js or CommonJS geospatial libraries
 */

/**
 * Calculate the great-circle distance between two points on Earth using the Haversine formula
 * @param a First point with latitude and longitude
 * @param b Second point with latitude and longitude
 * @returns Distance in kilometers
 */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  
  const a1 = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a1), Math.sqrt(1 - a1));
  
  return R * c;
}

/**
 * Calculate the great-circle distance between two points on Earth using the Haversine formula
 * @param a First point with latitude and longitude
 * @param b Second point with latitude and longitude
 * @returns Distance in miles
 */
export function haversineMiles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  return haversineKm(a, b) * 0.621371; // Convert km to miles
}

/**
 * Convert degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate estimated travel time in minutes based on distance and average speed
 * @param distanceKm Distance in kilometers
 * @param avgKph Average speed in kilometers per hour
 * @returns Travel time in minutes
 */
export function etaMinutes(distanceKm: number, avgKph: number): number {
  if (avgKph <= 0) return 0;
  return (distanceKm / avgKph) * 60;
}

/**
 * Calculate estimated travel time in minutes based on distance and average speed
 * @param distanceMiles Distance in miles
 * @param avgMph Average speed in miles per hour
 * @returns Travel time in minutes
 */
export function etaMinutesFromMiles(distanceMiles: number, avgMph: number): number {
  if (avgMph <= 0) return 0;
  return (distanceMiles / avgMph) * 60;
}

