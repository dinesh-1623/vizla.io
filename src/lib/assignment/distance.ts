/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate estimated travel time based on distance
 * Assumes average speed of 30 km/h in urban areas
 */
export function estimateTravelTime(distanceKm: number): number {
  const averageSpeedKmh = 30;
  const timeHours = distanceKm / averageSpeedKmh;
  return Math.round(timeHours * 60); // Convert to minutes
}

/**
 * Batch calculate distances for performance optimization
 */
export function batchCalculateDistances(
  points: Array<{ lat: number; lng: number }>,
  target: { lat: number; lng: number }
): number[] {
  return points.map(point => 
    calculateDistance(point.lat, point.lng, target.lat, target.lng)
  );
}
