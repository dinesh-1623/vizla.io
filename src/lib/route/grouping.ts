/**
 * Route Grouping Utilities
 * 
 * Functions for grouping nearby cars into efficient routes
 * and converting between data formats.
 */

import { Car } from '@/data/mockCars';
import { DALLAS_LOT, DEFAULT_ROUTE_PARAMS } from './config';
import { Point, RouteParams } from './engine';

/**
 * Group nearby cars using a simple heuristic approach
 * 
 * Algorithm: Sort cars by latitude, then create sliding windows of size k.
 * This creates geographically coherent groups that can be efficiently routed.
 * 
 * @param cars Array of cars with coordinates
 * @param k Maximum number of cars per group (default 5)
 * @returns Array of car groups
 */
export function groupNearby(cars: Car[], k = 5): Car[][] {
  if (cars.length === 0) return [];
  
  // Filter out cars without coordinates
  const carsWithCoords = cars.filter(car => 
    typeof car.lat === 'number' && 
    typeof car.lng === 'number' &&
    !isNaN(car.lat) && 
    !isNaN(car.lng)
  );
  
  if (carsWithCoords.length === 0) return [];
  
  // Sort by latitude for geographical grouping
  const sortedCars = [...carsWithCoords].sort((a, b) => a.lat - b.lat);
  
  const groups: Car[][] = [];
  
  // Create sliding windows of size k
  for (let i = 0; i < sortedCars.length; i += k) {
    const group = sortedCars.slice(i, i + k);
    if (group.length > 0) {
      groups.push(group);
    }
  }
  
  return groups;
}

/**
 * Alternative grouping using k-means-lite approach
 * 
 * This is a simplified k-means clustering that groups cars by proximity
 * to the lot location. More sophisticated than latitude sorting.
 * 
 * @param cars Array of cars with coordinates
 * @param k Maximum number of cars per group (default 5)
 * @returns Array of car groups
 */
export function groupNearbyKMeans(cars: Car[], k = 5): Car[][] {
  if (cars.length === 0) return [];
  
  // Filter out cars without coordinates
  const carsWithCoords = cars.filter(car => 
    typeof car.lat === 'number' && 
    typeof car.lng === 'number' &&
    !isNaN(car.lat) && 
    !isNaN(car.lng)
  );
  
  if (carsWithCoords.length === 0) return [];
  
  // Calculate number of groups needed
  const numGroups = Math.ceil(carsWithCoords.length / k);
  
  // Simple clustering: assign each car to the nearest group centroid
  // For simplicity, we'll use the lot as the initial reference point
  // and create groups based on distance from lot
  
  // Sort by distance from lot
  const sortedByDistance = [...carsWithCoords].sort((a, b) => {
    const distA = haversineDistance(DALLAS_LOT, { lat: a.lat, lng: a.lng });
    const distB = haversineDistance(DALLAS_LOT, { lat: b.lat, lng: b.lng });
    return distA - distB;
  });
  
  const groups: Car[][] = [];
  
  // Distribute cars into groups
  for (let i = 0; i < numGroups; i++) {
    const group: Car[] = [];
    for (let j = i; j < sortedByDistance.length; j += numGroups) {
      group.push(sortedByDistance[j]);
    }
    if (group.length > 0) {
      groups.push(group);
    }
  }
  
  return groups;
}

/**
 * Simple haversine distance calculation
 * @param a First point
 * @param b Second point
 * @returns Distance in miles
 */
function haversineDistance(a: Point, b: Point): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  
  const a1 = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a1), Math.sqrt(1 - a1));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert Car array to RouteParams format for route optimization
 * 
 * @param cars Array of cars with coordinates
 * @param lot Optional lot coordinates (defaults to Dallas lot)
 * @returns RouteParams object ready for route optimization
 */
export function toPoints(
  cars: Car[], 
  lot: Point = DALLAS_LOT
): RouteParams {
  // Filter out cars without coordinates
  const carsWithCoords = cars.filter(car => 
    typeof car.lat === 'number' && 
    typeof car.lng === 'number' &&
    !isNaN(car.lat) && 
    !isNaN(car.lng)
  );
  
  return {
    lot,
    cars: carsWithCoords.map(car => ({
      lat: car.lat,
      lng: car.lng,
      id: car.id
    })),
    ...DEFAULT_ROUTE_PARAMS
  };
}

/**
 * Check if a car has valid coordinates
 * @param car Car object to check
 * @returns True if car has valid coordinates
 */
export function hasValidCoordinates(car: Car): boolean {
  return typeof car.lat === 'number' && 
         typeof car.lng === 'number' &&
         !isNaN(car.lat) && 
         !isNaN(car.lng);
}

/**
 * Get cars without coordinates for warning display
 * @param cars Array of cars to check
 * @returns Array of cars missing coordinates
 */
export function getCarsWithoutCoordinates(cars: Car[]): Car[] {
  return cars.filter(car => !hasValidCoordinates(car));
}
